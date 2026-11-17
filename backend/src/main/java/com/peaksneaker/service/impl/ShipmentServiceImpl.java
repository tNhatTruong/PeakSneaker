package com.peaksneaker.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peaksneaker.dto.request.GhnWebhookRequest;
import com.peaksneaker.dto.response.GhnCreateOrderResult;
import com.peaksneaker.dto.response.ShipmentEventResponse;
import com.peaksneaker.dto.response.ShipmentResponse;
import com.peaksneaker.dto.response.WebhookReceiptResponse;
import com.peaksneaker.entity.InventoryAuditLog;
import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.OrderItem;
import com.peaksneaker.entity.Payment;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.entity.Shipment;
import com.peaksneaker.entity.ShipmentEvent;
import com.peaksneaker.entity.VoucherUsage;
import com.peaksneaker.enums.InventoryChangeType;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.ShipmentStatus;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.exception.UnauthorizedException;
import com.peaksneaker.repository.InventoryAuditLogRepository;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.PaymentRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.ShipmentEventRepository;
import com.peaksneaker.repository.ShipmentRepository;
import com.peaksneaker.repository.VoucherRepository;
import com.peaksneaker.repository.VoucherUsageRepository;
import com.peaksneaker.service.GhnService;
import com.peaksneaker.service.InventoryService;
import com.peaksneaker.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {
    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository shipmentEventRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryAuditLogRepository inventoryAuditLogRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final InventoryService inventoryService;
    private final GhnService ghnService;
    private final ObjectMapper objectMapper;

    @Value("${ghn.webhook.secret:}")
    private String webhookSecret;

    @Override
    @Transactional
    public ShipmentResponse dispatch(Long orderId) {
        Order order = findOrder(orderId);
        Shipment existing = shipmentRepository.findFirstByOrderOrderByCreatedAtDesc(order).orElse(null);
        if (existing != null && existing.getStatus() != ShipmentStatus.CANCELLED
                && existing.getStatus() != ShipmentStatus.RETURNED) {
            return toResponse(existing);
        }
        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new BadRequestException("Chỉ tạo vận đơn khi đơn hàng đã đóng gói và đang xử lý.");
        }

        GhnCreateOrderResult result = ghnService.createOrder(order,
                resolveDistrictId(order), resolveWardCode(order));
        BigDecimal cod = order.getPaymentMethod() == PaymentMethod.COD
                ? order.getFinalAmount() : BigDecimal.ZERO;
        Shipment shipment = Shipment.builder()
                .order(order)
                .providerOrderCode(result.getProviderOrderCode())
                .clientOrderCode(order.getOrderCode())
                .status(ShipmentStatus.READY_TO_PICK)
                .providerStatus(result.getProviderStatus())
                .codAmount(cod)
                .shippingFee(result.getShippingFee())
                .expectedDeliveryAt(result.getExpectedDeliveryAt())
                .providerResponse(result.getRawResponse())
                .build();
        shipmentRepository.save(shipment);
        order.setGhnOrderCode(result.getProviderOrderCode());
        order.setGhnTrackingStatus(result.getProviderStatus());
        orderRepository.save(order);
        return toResponse(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getForAdmin(Long orderId) {
        return toResponse(findLatestShipment(findOrder(orderId)));
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getForCustomer(Long userId, Long orderId) {
        Order order = findOrder(orderId);
        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xem vận đơn này.");
        }
        return toResponse(findLatestShipment(order));
    }

    @Override
    @Transactional
    public WebhookReceiptResponse processGhnWebhook(GhnWebhookRequest request, String token) {
        verifyWebhookToken(token);
        if (request.getOrderCode() == null || request.getOrderCode().isBlank()
                || request.getStatus() == null || request.getStatus().isBlank()) {
            throw new BadRequestException("Webhook GHN thiếu mã vận đơn hoặc trạng thái.");
        }

        Shipment shipment = shipmentRepository.findByProviderOrderCodeForUpdate(request.getOrderCode())
                .orElseThrow(() -> new ResourceNotFoundException("Vận đơn GHN", "orderCode", request.getOrderCode()));
        if (request.getClientOrderCode() != null && !request.getClientOrderCode().isBlank()
                && !shipment.getClientOrderCode().equals(request.getClientOrderCode())) {
            throw new BadRequestException("Mã đơn nội bộ trong webhook GHN không khớp với vận đơn.");
        }
        Instant occurredAt = request.getTime() == null ? Instant.now() : request.getTime();
        String eventType = blankToDefault(request.getType(), "switch_status").trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = request.getStatus().trim().toLowerCase(Locale.ROOT);
        String eventKey = sha256(String.join("|", request.getOrderCode(), eventType,
                normalizedStatus, occurredAt.toString(), blankToDefault(request.getReasonCode(), "")));
        if (shipmentEventRepository.existsByEventKey(eventKey)) {
            return receipt(shipment, true, false);
        }

        boolean applied = shipment.getLastEventAt() == null || !occurredAt.isBefore(shipment.getLastEventAt());
        ShipmentEvent event = ShipmentEvent.builder()
                .shipment(shipment)
                .eventKey(eventKey)
                .eventType(eventType)
                .providerStatus(request.getStatus())
                .occurredAt(occurredAt)
                .applied(applied)
                .payload(writeJson(request))
                .build();
        shipmentEventRepository.save(event);

        if (applied) {
            applyProviderStatus(shipment, normalizedStatus, occurredAt);
            if (request.getCodAmount() != null) shipment.setCodAmount(request.getCodAmount());
            if (request.getTotalFee() != null) shipment.setShippingFee(request.getTotalFee());
            shipment.setProviderStatus(normalizedStatus);
            shipment.setLastEventAt(occurredAt);
            shipment.getOrder().setGhnTrackingStatus(normalizedStatus);
            shipmentRepository.save(shipment);
            orderRepository.save(shipment.getOrder());
        }
        return receipt(shipment, false, applied);
    }

    private void applyProviderStatus(Shipment shipment, String rawStatus, Instant occurredAt) {
        String status = rawStatus.trim().toLowerCase(Locale.ROOT);
        switch (status) {
            case "ready_to_pick" -> shipment.setStatus(ShipmentStatus.READY_TO_PICK);
            case "picking", "money_collect_picking" -> shipment.setStatus(ShipmentStatus.PICKING);
            case "picked", "storing", "transporting", "sorting" -> {
                shipment.setStatus(ShipmentStatus.IN_TRANSIT);
                advanceToShipping(shipment.getOrder());
            }
            case "delivering", "money_collect_delivering" -> {
                shipment.setStatus(ShipmentStatus.DELIVERING);
                advanceToShipping(shipment.getOrder());
            }
            case "delivered" -> {
                shipment.setStatus(ShipmentStatus.DELIVERED);
                advanceToDelivered(shipment.getOrder(), occurredAt);
                if (shipment.getOrder().getPaymentMethod() == PaymentMethod.COD) {
                    markCodPaymentPaid(shipment.getOrder(), occurredAt);
                }
            }
            case "delivery_fail" -> shipment.setStatus(ShipmentStatus.DELIVERY_FAILED);
            case "waiting_to_return", "return", "return_transporting", "return_sorting", "returning" -> {
                shipment.setStatus(ShipmentStatus.RETURNING);
                advanceToShipping(shipment.getOrder());
            }
            case "returned" -> {
                shipment.setStatus(ShipmentStatus.RETURNED);
                advanceToShipping(shipment.getOrder());
                restockReturnedShipment(shipment, occurredAt);
                shipment.getOrder().cancelAfterCarrierReturn("GHN hoàn hàng về kho");
            }
            case "return_fail" -> shipment.setStatus(ShipmentStatus.RETURN_FAILED);
            case "cancel" -> shipment.setStatus(ShipmentStatus.CANCELLED);
            case "exception", "damage", "lost" -> shipment.setStatus(ShipmentStatus.EXCEPTION);
            default -> {
                // Vẫn lưu raw event để audit nhưng không làm sai lệch trạng thái nội bộ
                // khi GHN bổ sung một status mới mà hệ thống chưa map.
            }
        }
    }

    private void markCodPaymentPaid(Order order, Instant occurredAt) {
        order.updatePaymentStatus(PaymentStatus.PAID);
        Payment payment = paymentRepository.findFirstByOrderOrderByCreatedAtDesc(order).orElse(null);
        if (payment != null && payment.getStatus() != PaymentStatus.PAID) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(occurredAt);
            paymentRepository.save(payment);
        }
    }

    private void advanceToShipping(Order order) {
        if (order.getStatus() == OrderStatus.PROCESSING) {
            order.advanceStatus(OrderStatus.SHIPPING);
        }
    }

    private void advanceToDelivered(Order order, Instant deliveredAt) {
        advanceToShipping(order);
        if (order.getStatus() == OrderStatus.SHIPPING) {
            order.advanceStatus(OrderStatus.DELIVERED);
            order.setDeliveredAt(deliveredAt);
        }
    }

    private void restockReturnedShipment(Shipment shipment, Instant occurredAt) {
        if (shipment.getRestockedAt() != null) return;
        for (OrderItem item : shipment.getOrder().getItems()) {
            if (item.getProductVariant() == null) continue;
            ProductVariant variant = productVariantRepository.findByIdWithLock(item.getProductVariant().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", item.getProductVariant().getId()));
            variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
            productVariantRepository.save(variant);
            if (inventoryService != null) {
                inventoryService.restoreBatchesFifo(variant.getId(), item.getQuantity());
            }
            inventoryAuditLogRepository.save(InventoryAuditLog.builder()
                    .variant(variant)
                    .changeType(InventoryChangeType.RETURN)
                    .quantityChanged(item.getQuantity())
                    .balanceAfter(variant.getStockQuantity())
                    .reason("GHN hoàn vận đơn " + shipment.getProviderOrderCode())
                    .performedBy("GHN_WEBHOOK")
                    .build());
        }
        if (shipment.getOrder().getVoucher() != null) {
            shipment.getOrder().getVoucher().decrementUsage();
            voucherRepository.save(shipment.getOrder().getVoucher());
            if (voucherUsageRepository != null && shipment.getOrder().getId() != null) {
                List<VoucherUsage> usages = voucherUsageRepository.findByOrderId(shipment.getOrder().getId());
                if (usages != null && !usages.isEmpty()) {
                    voucherUsageRepository.deleteAll(usages);
                }
            }
        }
        shipment.setRestockedAt(occurredAt);
    }

    private int resolveDistrictId(Order order) {
        if (order.getShippingDistrictId() == null || order.getShippingDistrictId() <= 0) {
            throw new BadRequestException("Đơn hàng chưa lưu mã quận/huyện GHN.");
        }
        return order.getShippingDistrictId();
    }

    private String resolveWardCode(Order order) {
        if (order.getShippingWardCode() == null || order.getShippingWardCode().isBlank()) {
            throw new BadRequestException("Đơn hàng chưa lưu mã phường/xã GHN.");
        }
        return order.getShippingWardCode();
    }

    private void verifyWebhookToken(String token) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new UnauthorizedException("Webhook GHN chưa được cấu hình secret.");
        }
        byte[] expected = webhookSecret.getBytes(StandardCharsets.UTF_8);
        byte[] actual = (token == null ? "" : token).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new UnauthorizedException("Webhook GHN không hợp lệ.");
        }
    }

    private Shipment findLatestShipment(Order order) {
        return shipmentRepository.findFirstByOrderOrderByCreatedAtDesc(order)
                .orElseThrow(() -> new ResourceNotFoundException("Vận đơn", "orderId", order.getId()));
    }

    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        List<ShipmentEventResponse> events = shipment.getId() == null ? List.of()
                : shipmentEventRepository.findByShipmentIdOrderByOccurredAtAscIdAsc(shipment.getId()).stream()
                .map(event -> ShipmentEventResponse.builder()
                        .id(event.getId())
                        .eventType(event.getEventType())
                        .providerStatus(event.getProviderStatus())
                        .occurredAt(event.getOccurredAt())
                        .applied(event.isApplied())
                        .build())
                .toList();
        return ShipmentResponse.builder()
                .id(shipment.getId())
                .orderId(shipment.getOrder().getId())
                .provider(shipment.getProvider())
                .providerOrderCode(shipment.getProviderOrderCode())
                .status(shipment.getStatus())
                .providerStatus(shipment.getProviderStatus())
                .codAmount(shipment.getCodAmount())
                .shippingFee(shipment.getShippingFee())
                .expectedDeliveryAt(shipment.getExpectedDeliveryAt())
                .lastEventAt(shipment.getLastEventAt())
                .events(events)
                .build();
    }

    private WebhookReceiptResponse receipt(Shipment shipment, boolean duplicate, boolean applied) {
        return WebhookReceiptResponse.builder()
                .duplicate(duplicate)
                .applied(applied)
                .providerOrderCode(shipment.getProviderOrderCode())
                .providerStatus(shipment.getProviderStatus())
                .build();
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Không thể lưu nội dung webhook GHN.");
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 không khả dụng", ex);
        }
    }
}
