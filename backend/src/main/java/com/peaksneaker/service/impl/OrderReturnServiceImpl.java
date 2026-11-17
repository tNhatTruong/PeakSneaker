package com.peaksneaker.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peaksneaker.dto.request.OrderReturnRequest;
import com.peaksneaker.dto.request.OrderReturnFilterDto;
import com.peaksneaker.dto.request.UpdateReturnItemRequest;
import com.peaksneaker.dto.request.UpdateReturnStatusRequest;
import com.peaksneaker.dto.response.OrderReturnResponse;
import com.peaksneaker.dto.response.OrderReturnFilterOptionsResponse;
import com.peaksneaker.entity.*;
import com.peaksneaker.enums.InventoryChangeType;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.ReturnStatus;
import com.peaksneaker.enums.ReturnType;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.*;
import com.peaksneaker.repository.specification.OrderReturnSpecification;
import com.peaksneaker.service.EmailService;
import com.peaksneaker.service.OrderReturnService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderReturnServiceImpl implements OrderReturnService {

    private final OrderReturnRepository orderReturnRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderReturnItemRepository orderReturnItemRepository;
    private final InventoryAuditLogRepository inventoryAuditLogRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public OrderReturnResponse createReturnRequest(Long userId, OrderReturnRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", request.getOrderId()));

        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền gửi yêu cầu đổi trả cho đơn hàng này");
        }
        if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Chỉ có thể yêu cầu đổi trả cho đơn hàng đã giao thành công");
        }
        if (order.getDeliveredAt() == null) {
            throw new BadRequestException("Đơn hàng chưa có thời điểm giao thành công để xác định hạn đổi trả");
        }
        if (Instant.now().isAfter(order.getDeliveredAt().plus(7, ChronoUnit.DAYS))) {
            throw new BadRequestException("Đơn hàng đã quá thời hạn đổi trả 7 ngày");
        }

        Map<Long, OrderItem> orderItems = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getId, Function.identity()));
        if (request.getItems().stream().map(item -> item.getOrderItemId()).distinct().count() != request.getItems().size()) {
            throw new BadRequestException("Một mặt hàng không thể xuất hiện nhiều lần trong cùng yêu cầu đổi trả");
        }

        OrderReturn orderReturn = OrderReturn.builder()
                .order(order)
                .user(user)
                .returnType(request.getReturnType())
                .reasonCode(request.getReasonCode())
                .reason(request.getReason())
                .evidenceImages(serializeEvidenceImages(request.getEvidenceImages()))
                .status(ReturnStatus.REQUESTED)
                .refundAmount(BigDecimal.ZERO)
                .build();

        request.getItems().forEach(requestItem -> {
            OrderItem orderItem = orderItems.get(requestItem.getOrderItemId());
            if (orderItem == null) {
                throw new BadRequestException("Mặt hàng #" + requestItem.getOrderItemId() + " không thuộc đơn hàng này");
            }
            long alreadyRequested = orderReturnItemRepository.sumRequestedQuantityByOrderItemExcludingStatus(
                    orderItem.getId(), ReturnStatus.REJECTED);
            if (alreadyRequested + requestItem.getQuantity() > orderItem.getQuantity()) {
                throw new BadRequestException("Số lượng đổi trả của " + orderItem.getProductName() + " vượt quá số lượng đã mua");
            }
            orderReturn.addItem(OrderReturnItem.builder()
                    .orderItem(orderItem)
                    .requestedQuantity(requestItem.getQuantity())
                    .build());
        });

        return OrderReturnResponse.fromEntity(orderReturnRepository.save(orderReturn));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderReturnResponse> getUserReturns(Long userId) {
        return orderReturnRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderReturnResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderReturnResponse> getUserReturnsPaginated(Long userId, Pageable pageable) {
        return orderReturnRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(OrderReturnResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderReturnResponse getReturnById(Long returnId) {
        return OrderReturnResponse.fromEntity(findReturn(returnId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderReturnResponse> getAllReturns(Pageable pageable) {
        return orderReturnRepository.findAll(pageable).map(OrderReturnResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderReturnResponse> getReturnsByStatus(ReturnStatus status, Pageable pageable) {
        return orderReturnRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(OrderReturnResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderReturnResponse> getReturnsByOrderId(Long orderId, Pageable pageable) {
        return orderReturnRepository.findByOrderIdOrderByCreatedAtDesc(orderId, pageable)
                .map(OrderReturnResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderReturnResponse> searchReturns(OrderReturnFilterDto filter, Pageable pageable) {
        return orderReturnRepository.findAll(OrderReturnSpecification.withFilters(filter), pageable)
                .map(OrderReturnResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderReturnFilterOptionsResponse getFilterOptions() {
        Map<ReturnStatus, Long> statusCounts = java.util.Arrays.stream(ReturnStatus.values())
                .collect(Collectors.toMap(Function.identity(), orderReturnRepository::countByStatus));
        List<OrderReturnFilterOptionsResponse.ProductOption> products = orderReturnRepository.findReturnProductOptions()
                .stream()
                .map(row -> OrderReturnFilterOptionsResponse.ProductOption.builder()
                        .id((Long) row[0])
                        .name((String) row[1])
                        .build())
                .toList();
        return OrderReturnFilterOptionsResponse.builder()
                .statusCounts(statusCounts)
                .products(products)
                .build();
    }

    @Override
    @Transactional
    public OrderReturnResponse processReturn(Long returnId, UpdateReturnStatusRequest request, String adminEmail) {
        OrderReturn orderReturn = findReturn(returnId);
        ReturnStatus nextStatus = request.getStatus();
        validateStatusTransition(orderReturn.getStatus(), nextStatus);
        applyItemDecisions(orderReturn, request, nextStatus);
        validateResolution(orderReturn, request, nextStatus);
        applyRefundAmount(orderReturn, request.getRefundAmount(), nextStatus);

        orderReturn.setStatus(nextStatus);
        orderReturn.setProcessedBy(adminEmail);
        if (request.getAdminNotes() != null) orderReturn.setAdminNotes(request.getAdminNotes());
        if (nextStatus == ReturnStatus.COMPLETED) {
            restockAcceptedItems(orderReturn, adminEmail);
            if (orderReturn.getReturnType() == ReturnType.RETURN_REFUND
                    && orderReturn.getOrder() != null
                    && orderReturn.getRefundAmount() != null
                    && orderReturn.getRefundAmount().signum() > 0
                    && orderReturn.getOrder().getPaymentStatus() == PaymentStatus.PAID) {
                orderReturn.getOrder().updatePaymentStatus(PaymentStatus.REFUNDED);
                orderRepository.save(orderReturn.getOrder());
            }
        }

        OrderReturn saved = orderReturnRepository.save(orderReturn);
        if (saved.getUser() != null && saved.getUser().getEmail() != null) {
            emailService.sendReturnStatusEmail(
                    saved.getUser().getEmail(), saved.getId(), nextStatus.name(), saved.getAdminNotes());
        }
        return OrderReturnResponse.fromEntity(saved);
    }

    private OrderReturn findReturn(Long returnId) {
        return orderReturnRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu đổi trả", "id", returnId));
    }

    private String serializeEvidenceImages(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images == null ? List.of() : images);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("Danh sách ảnh bằng chứng không hợp lệ");
        }
    }

    private void validateStatusTransition(ReturnStatus currentStatus, ReturnStatus nextStatus) {
        Map<ReturnStatus, Set<ReturnStatus>> transitions = Map.of(
                ReturnStatus.REQUESTED, EnumSet.of(ReturnStatus.APPROVED, ReturnStatus.REJECTED),
                ReturnStatus.APPROVED, EnumSet.of(ReturnStatus.GOODS_RECEIVED),
                ReturnStatus.GOODS_RECEIVED, EnumSet.of(ReturnStatus.COMPLETED),
                ReturnStatus.REJECTED, EnumSet.noneOf(ReturnStatus.class),
                ReturnStatus.COMPLETED, EnumSet.noneOf(ReturnStatus.class)
        );
        if (!transitions.getOrDefault(currentStatus, Set.of()).contains(nextStatus)) {
            throw new BadRequestException("Không thể chuyển RMA từ " + currentStatus + " sang " + nextStatus);
        }
    }

    private void applyItemDecisions(
            OrderReturn orderReturn,
            UpdateReturnStatusRequest request,
            ReturnStatus nextStatus
    ) {
        if (request.getItems() != null
                && request.getItems().stream().map(UpdateReturnItemRequest::getReturnItemId).distinct().count()
                != request.getItems().size()) {
            throw new BadRequestException("Một dòng RMA không thể được cập nhật nhiều lần trong cùng yêu cầu");
        }
        Map<Long, UpdateReturnItemRequest> updates = request.getItems() == null
                ? Map.of()
                : request.getItems().stream().collect(Collectors.toMap(
                        UpdateReturnItemRequest::getReturnItemId, Function.identity()));

        Set<Long> returnItemIds = orderReturn.getItems().stream()
                .map(OrderReturnItem::getId)
                .collect(Collectors.toSet());
        if (!returnItemIds.containsAll(updates.keySet())) {
            throw new BadRequestException("Yêu cầu cập nhật chứa mặt hàng không thuộc RMA này");
        }

        for (OrderReturnItem item : orderReturn.getItems()) {
            UpdateReturnItemRequest update = updates.get(item.getId());
            if (update != null) {
                if (nextStatus == ReturnStatus.APPROVED && update.getApprovedQuantity() != null) {
                    item.setApprovedQuantity(update.getApprovedQuantity());
                }
                if (nextStatus == ReturnStatus.GOODS_RECEIVED) {
                    if (update.getReceivedQuantity() != null) item.setReceivedQuantity(update.getReceivedQuantity());
                    if (update.getRestockableQuantity() != null) item.setRestockableQuantity(update.getRestockableQuantity());
                    if (update.getConditionNote() != null) item.setConditionNote(update.getConditionNote());
                }
                if ((nextStatus == ReturnStatus.GOODS_RECEIVED || nextStatus == ReturnStatus.COMPLETED)
                        && update.getReplacementVariantId() != null) {
                    ProductVariant replacementVariant = productVariantRepository.findById(update.getReplacementVariantId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Biến thể thay thế", "id", update.getReplacementVariantId()));
                    if (orderReturn.getReturnType() != ReturnType.EXCHANGE) {
                        throw new BadRequestException("Yêu cầu hoàn tiền không được chọn biến thể thay thế");
                    }
                    ProductVariant originalVariant = item.getOrderItem().getProductVariant();
                    if (originalVariant == null
                            || !replacementVariant.getProduct().getId().equals(originalVariant.getProduct().getId())) {
                        throw new BadRequestException("Biến thể thay thế phải thuộc cùng sản phẩm đã mua");
                    }
                    item.setReplacementVariant(replacementVariant);
                }
            }

            if (nextStatus == ReturnStatus.APPROVED && update == null && item.getApprovedQuantity() == 0) {
                item.setApprovedQuantity(item.getRequestedQuantity());
            }
            if (nextStatus == ReturnStatus.GOODS_RECEIVED && update == null && item.getReceivedQuantity() == 0) {
                item.setReceivedQuantity(item.getApprovedQuantity());
                item.setRestockableQuantity(item.getApprovedQuantity());
            }
            validateQuantities(item);

            if (orderReturn.getReturnType() == ReturnType.EXCHANGE
                    && nextStatus == ReturnStatus.COMPLETED
                    && item.getReplacementVariant() == null) {
                throw new BadRequestException("Vui lòng chọn biến thể thay thế cho từng mặt hàng đổi");
            }
        }
    }

    private void validateQuantities(OrderReturnItem item) {
        int requested = item.getRequestedQuantity();
        int approved = item.getApprovedQuantity();
        int received = item.getReceivedQuantity();
        int restockable = item.getRestockableQuantity();
        if (approved < 0 || approved > requested
                || received < 0 || received > approved
                || restockable < 0 || restockable > received) {
            throw new BadRequestException("Số lượng xử lý của mặt hàng #" + item.getId() + " không hợp lệ");
        }
    }

    private void validateResolution(
            OrderReturn orderReturn,
            UpdateReturnStatusRequest request,
            ReturnStatus nextStatus
    ) {
        if (nextStatus == ReturnStatus.REJECTED
                && (request.getAdminNotes() == null || request.getAdminNotes().isBlank())) {
            throw new BadRequestException("Vui lòng nhập lý do từ chối yêu cầu đổi trả");
        }
        if (nextStatus == ReturnStatus.APPROVED
                && orderReturn.getItems().stream().noneMatch(item -> item.getApprovedQuantity() > 0)) {
            throw new BadRequestException("Phải chấp thuận ít nhất một mặt hàng hoặc từ chối toàn bộ yêu cầu");
        }
        if ((nextStatus == ReturnStatus.GOODS_RECEIVED || nextStatus == ReturnStatus.COMPLETED)
                && orderReturn.getItems().stream().noneMatch(item -> item.getReceivedQuantity() > 0)) {
            throw new BadRequestException("Chưa ghi nhận mặt hàng hoàn nào đã được nhận");
        }
        if (nextStatus == ReturnStatus.COMPLETED
                && orderReturn.getItems().stream().anyMatch(
                        item -> !item.getReceivedQuantity().equals(item.getApprovedQuantity()))) {
            throw new BadRequestException("Chỉ có thể hoàn tất khi đã nhận đủ toàn bộ số lượng được duyệt");
        }
    }

    private void applyRefundAmount(OrderReturn orderReturn, BigDecimal refundAmount, ReturnStatus nextStatus) {
        if (orderReturn.getReturnType() == ReturnType.EXCHANGE) {
            orderReturn.setRefundAmount(BigDecimal.ZERO);
            return;
        }
        if (refundAmount == null) {
            if (nextStatus == ReturnStatus.COMPLETED && orderReturn.getRefundAmount().signum() == 0) {
                throw new BadRequestException("Vui lòng nhập số tiền hoàn trước khi hoàn tất yêu cầu trả hàng");
            }
            return;
        }
        if (refundAmount.signum() < 0) throw new BadRequestException("Số tiền hoàn không được âm");

        BigDecimal approvedGross = orderReturn.getItems().stream()
                .map(item -> item.getOrderItem().getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getApprovedQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal orderSubtotal = orderReturn.getOrder().getSubtotalAmount();
        BigDecimal merchandisePaid = orderSubtotal.subtract(orderReturn.getOrder().getDiscountAmount())
                .max(BigDecimal.ZERO);
        BigDecimal maximumRefund = orderSubtotal.signum() == 0
                ? BigDecimal.ZERO
                : approvedGross.multiply(merchandisePaid)
                        .divide(orderSubtotal, 2, RoundingMode.HALF_UP)
                        .min(merchandisePaid);
        if (refundAmount.compareTo(maximumRefund) > 0) {
            throw new BadRequestException("Số tiền hoàn vượt quá giá trị các mặt hàng đã duyệt");
        }
        if (nextStatus == ReturnStatus.COMPLETED && refundAmount.signum() == 0) {
            throw new BadRequestException("Vui lòng nhập số tiền hoàn trước khi hoàn tất yêu cầu trả hàng");
        }
        orderReturn.setRefundAmount(refundAmount);
    }

    private void restockAcceptedItems(OrderReturn orderReturn, String adminEmail) {
        for (OrderReturnItem returnItem : orderReturn.getItems()) {
            if (returnItem.getRestockedAt() != null || returnItem.getRestockableQuantity() <= 0) continue;

            ProductVariant originalVariant = returnItem.getOrderItem().getProductVariant();
            if (originalVariant != null) {
                ProductVariant lockedVariant = productVariantRepository.findByIdWithLock(originalVariant.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", originalVariant.getId()));
                lockedVariant.increaseStock(returnItem.getRestockableQuantity());
                productVariantRepository.save(lockedVariant);
                saveInventoryAudit(lockedVariant, returnItem.getRestockableQuantity(), orderReturn, adminEmail, "Hoàn kho hàng đổi trả");
            }

            if (orderReturn.getReturnType() == ReturnType.EXCHANGE) {
                ProductVariant replacement = productVariantRepository.findByIdWithLock(
                                returnItem.getReplacementVariant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Biến thể thay thế", "id", returnItem.getReplacementVariant().getId()));
                replacement.decreaseStock(returnItem.getReceivedQuantity());
                productVariantRepository.save(replacement);
                saveInventoryAudit(replacement, -returnItem.getReceivedQuantity(), orderReturn, adminEmail, "Xuất kho hàng đổi");
            }
            returnItem.setRestockedAt(Instant.now());
        }
    }

    private void saveInventoryAudit(
            ProductVariant variant,
            int quantity,
            OrderReturn orderReturn,
            String adminEmail,
            String action
    ) {
        inventoryAuditLogRepository.save(InventoryAuditLog.builder()
                .variant(variant)
                .changeType(InventoryChangeType.RETURN)
                .quantityChanged(quantity)
                .balanceAfter(variant.getStockQuantity())
                .reason(action + " từ RMA #" + orderReturn.getId() + " (đơn #" + orderReturn.getOrder().getId() + ")")
                .performedBy(adminEmail)
                .build());
    }
}
