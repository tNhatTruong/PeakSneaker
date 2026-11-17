package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.AdminCreateOrderRequest;
import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.request.OrderFilterDto;
import com.peaksneaker.dto.response.OrderItemResponse;
import com.peaksneaker.dto.response.OrderResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.entity.*;
import com.peaksneaker.enums.InventoryChangeType;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.ShipmentStatus;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.*;
import com.peaksneaker.service.EmailService;
import com.peaksneaker.service.GhnService;
import com.peaksneaker.service.InventoryService;
import com.peaksneaker.service.OrderService;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryAuditLogRepository inventoryAuditLogRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final CloudinaryService cloudinaryService;
    private final EmailService emailService;
    private final GhnService ghnService;
    private final InventoryService inventoryService;
    private final VoucherUsageRepository voucherUsageRepository;

    @Override
    @Transactional
    public Order checkout(Long userId, CheckoutRequest request) {
        String checkoutKey = request.getIdempotencyKey().trim();
        if (checkoutKey.length() > 64) {
            throw new BadRequestException("Mã chống tạo trùng đơn hàng không được vượt quá 64 ký tự.");
        }
        Order existingOrder = orderRepository.findByUserIdAndCheckoutKey(userId, checkoutKey).orElse(null);
        if (existingOrder != null) {
            return existingOrder;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Address address = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                .orElseThrow(() -> new BadRequestException("Địa chỉ giao hàng không hợp lệ hoặc không thuộc về bạn."));

        if (address.getDistrictId() == null || address.getDistrictId() <= 0
                || address.getWardCode() == null || address.getWardCode().isBlank()) {
            throw new BadRequestException("Địa chỉ giao hàng chưa có mã quận/huyện hoặc phường/xã hợp lệ cho GHN.");
        }
        BigDecimal shippingFee = ghnService.calculateFeeAmount(address.getDistrictId(), address.getWardCode());

        Voucher voucher = null;
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            voucher = voucherRepository.findByCodeWithLock(request.getVoucherCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ."));
            if (!voucher.getIsActive() || voucher.isExpired() || voucher.isLimitReached()) {
                throw new BadRequestException("Mã giảm giá đã hết hạn hoặc hết lượt sử dụng.");
            }
            if (voucher.getPerUserLimit() != null && voucher.getPerUserLimit() > 0) {
                long userUsageCount = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), user.getId());
                if (userUsageCount >= voucher.getPerUserLimit()) {
                    throw new BadRequestException("Bạn đã dùng hết số lượt cho phép của mã giảm giá này (tối đa "
                            + voucher.getPerUserLimit() + " lượt/khách).");
                }
            }
        }

        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .checkoutKey(checkoutKey)
                .user(user)
                .voucher(voucher)
                .shippingName(address.getRecipientName())
                .shippingPhone(address.getPhone())
                .shippingProvince(address.getProvinceName())
                .shippingDistrict(address.getDistrictName())
                .shippingDistrictId(address.getDistrictId())
                .shippingWard(address.getWardName())
                .shippingWardCode(address.getWardCode())
                .shippingStreet(address.getStreetDetail())
                .note(request.getNote())
                .shippingFee(shippingFee)
                .paymentMethod(request.getPaymentMethod())
                .build();

        if (request.getBuyNowVariantId() != null && request.getBuyNowQuantity() != null) {
            // Mua ngay với Pessimistic Write Lock
            ProductVariant variant = productVariantRepository.findByIdWithLock(request.getBuyNowVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Phân loại sản phẩm", "id", request.getBuyNowVariantId()));

            int qty = request.getBuyNowQuantity();
            if (qty <= 0 || qty > 99) {
                throw new BadRequestException("Số lượng đặt mua phải từ 1 đến 99 sản phẩm.");
            }
            if (variant.getStockQuantity() < qty) {
                throw new BadRequestException("Sản phẩm " + (variant.getProduct() != null ? variant.getProduct().getName() : "") 
                        + " (" + variant.getSku() + ") chỉ còn " + variant.getStockQuantity() + " sản phẩm, không đủ số lượng đặt.");
            }

            variant.setStockQuantity(variant.getStockQuantity() - qty);
            productVariantRepository.save(variant);
            inventoryService.deductBatchesFifo(variant.getId(), qty);

            Product product = variant.getProduct();
            String imageUrl = resolveProductImageUrl(product);

            OrderItem orderItem = OrderItem.builder()
                    .productVariant(variant)
                    .productName(product != null ? product.getName() : "Sản phẩm")
                    .sku(variant.getSku())
                    .variantName((variant.getColor() != null ? variant.getColor() : "") + " " + (variant.getSize() != null ? variant.getSize() : ""))
                    .quantity(qty)
                    .unitPrice(variant.getFinalPrice())
                    .imageUrl(imageUrl)
                    .build();
            orderItem.calculateSubtotal();
            order.addItem(orderItem);

        } else {
            // Thanh toán toàn bộ giỏ hàng
            Cart cart = cartRepository.findByUser(user)
                    .orElseThrow(() -> new BadRequestException("Giỏ hàng trống."));

            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new BadRequestException("Không có sản phẩm nào trong giỏ hàng.");
            }

            for (CartItem cartItem : cart.getItems()) {
                ProductVariant variant = productVariantRepository.findByIdWithLock(cartItem.getProductVariant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", cartItem.getProductVariant().getId()));

                int qty = cartItem.getQuantity();
                if (qty <= 0 || qty > 99) {
                    throw new BadRequestException("Số lượng sản phẩm trong giỏ hàng không hợp lệ (phải từ 1 đến 99).");
                }
                if (variant.getStockQuantity() < qty) {
                    throw new BadRequestException("Sản phẩm " + (variant.getProduct() != null ? variant.getProduct().getName() : "") 
                            + " (" + variant.getSku() + ") chỉ còn " + variant.getStockQuantity() + " sản phẩm, không đủ số lượng đặt.");
                }

                variant.setStockQuantity(variant.getStockQuantity() - qty);
                productVariantRepository.save(variant);

                Product product = variant.getProduct();
                String imageUrl = resolveProductImageUrl(product);

                OrderItem orderItem = OrderItem.builder()
                        .productVariant(variant)
                        .productName(product != null ? product.getName() : "Sản phẩm")
                        .sku(variant.getSku())
                        .variantName((variant.getColor() != null ? variant.getColor() : "") + " " + (variant.getSize() != null ? variant.getSize() : ""))
                        .quantity(qty)
                        .unitPrice(variant.getFinalPrice())
                        .imageUrl(imageUrl)
                        .build();
                orderItem.calculateSubtotal();
                order.addItem(orderItem);
            }

            cart.clear();
            cartRepository.save(cart);
        }

        order.calculateTotals(order.getShippingFee());

        if (voucher != null) {
            if (!voucher.isValidForOrder(order.getSubtotalAmount())) {
                throw new BadRequestException("Mã giảm giá không đủ điều kiện áp dụng cho đơn hàng này.");
            }
            voucher.incrementUsage();
            voucherRepository.save(voucher);
        }

        Order savedOrder = orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(savedOrder)
                .paymentMethod(savedOrder.getPaymentMethod())
                .transactionId((savedOrder.getPaymentMethod() == PaymentMethod.COD ? "COD-" : "VNP-")
                        + savedOrder.getOrderCode())
                .amount(savedOrder.getFinalAmount())
                .status(savedOrder.getPaymentMethod() == PaymentMethod.COD
                        ? PaymentStatus.UNPAID : PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        if (voucher != null) {
            VoucherUsage usage = VoucherUsage.builder()
                    .voucher(voucher)
                    .user(user)
                    .orderId(savedOrder.getId())
                    .build();
            voucherUsageRepository.save(usage);
        }

        // Ghi nhận Audit Log cho từng item
        for (OrderItem item : savedOrder.getItems()) {
            if (item.getProductVariant() != null) {
                InventoryAuditLog auditLog = InventoryAuditLog.builder()
                        .variant(item.getProductVariant())
                        .changeType(InventoryChangeType.ORDER_HOLD)
                        .quantityChanged(-item.getQuantity())
                        .balanceAfter(item.getProductVariant().getStockQuantity())
                        .reason("Bán hàng đơn #" + savedOrder.getId())
                        .performedBy(user.getEmail())
                        .build();
                inventoryAuditLogRepository.save(auditLog);
            }
        }

        // Gửi email hóa đơn xác nhận đơn hàng bất đồng bộ
        try {
            emailService.sendOrderConfirmationEmail(user.getEmail(), savedOrder);
        } catch (Exception e) {
            log.warn("Không thể gửi email xác nhận đơn hàng: {}", e.getMessage());
        }

        return savedOrder;
    }

    @Override
    @Transactional
    public OrderResponse createOrderAdmin(AdminCreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Đơn hàng phải có ít nhất 1 sản phẩm.");
        }
        if (request.getShippingDistrictId() == null || request.getShippingDistrictId() <= 0
                || request.getShippingWardCode() == null || request.getShippingWardCode().isBlank()) {
            throw new BadRequestException("Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã giao hàng.");
        }

        User customer = null;
        if (request.getUserId() != null) {
            customer = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Khách hàng", "id", request.getUserId()));
        }

        BigDecimal shippingFee;
        try {
            shippingFee = ghnService.calculateFeeAmount(
                    request.getShippingDistrictId(),
                    request.getShippingWardCode().trim());
        } catch (Exception ex) {
            log.warn("Không thể lấy phí GHN tự động khi tạo đơn Admin, áp dụng phí mặc định 30.000đ: {}", ex.getMessage());
            shippingFee = BigDecimal.valueOf(30_000);
        }

        Voucher voucher = null;
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            voucher = voucherRepository.findByCodeWithLock(request.getVoucherCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ."));
            if (!voucher.getIsActive() || voucher.isExpired() || voucher.isLimitReached()) {
                throw new BadRequestException("Mã giảm giá đã hết hạn hoặc hết lượt sử dụng.");
            }
            if (customer != null && voucher.getPerUserLimit() != null && voucher.getPerUserLimit() > 0) {
                long userUsageCount = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), customer.getId());
                if (userUsageCount >= voucher.getPerUserLimit()) {
                    throw new BadRequestException("Khách hàng đã dùng hết số lượt cho phép của mã giảm giá này (tối đa "
                            + voucher.getPerUserLimit() + " lượt/khách).");
                }
            }
        }

        PaymentMethod paymentMethod = request.getPaymentMethod() != null
                ? request.getPaymentMethod()
                : PaymentMethod.COD;

        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .checkoutKey("ADMIN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24))
                .user(customer)
                .voucher(voucher)
                .status(OrderStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod(paymentMethod)
                .shippingName(request.getShippingName().trim())
                .shippingPhone(request.getShippingPhone().trim())
                .shippingProvince(request.getShippingProvince().trim())
                .shippingDistrict(request.getShippingDistrict().trim())
                .shippingDistrictId(request.getShippingDistrictId())
                .shippingWard(request.getShippingWard().trim())
                .shippingWardCode(request.getShippingWardCode().trim())
                .shippingStreet(request.getShippingStreet().trim())
                .note(request.getNote() != null && !request.getNote().isBlank()
                        ? request.getNote().trim()
                        : "Đơn đặt qua hotline / tại quầy (Tạo bởi quản trị viên)")
                .shippingFee(shippingFee)
                .build();

        for (AdminCreateOrderRequest.OrderItemInput itemInput : request.getItems()) {
            ProductVariant variant = productVariantRepository.findByIdWithLock(itemInput.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Biến thể sản phẩm", "id", itemInput.getVariantId()));

            int qty = itemInput.getQuantity() != null ? itemInput.getQuantity() : 0;
            if (qty <= 0) {
                throw new BadRequestException("Số lượng sản phẩm phải lớn hơn 0.");
            }
            if (variant.getStockQuantity() < qty) {
                throw new BadRequestException("Sản phẩm "
                        + (variant.getProduct() != null ? variant.getProduct().getName() : "")
                        + " (" + variant.getSku() + ") chỉ còn " + variant.getStockQuantity()
                        + " sản phẩm trong kho.");
            }

            variant.setStockQuantity(variant.getStockQuantity() - qty);
            productVariantRepository.save(variant);
            inventoryService.deductBatchesFifo(variant.getId(), qty);

            Product product = variant.getProduct();
            String imageUrl = resolveProductImageUrl(product);

            OrderItem orderItem = OrderItem.builder()
                    .productVariant(variant)
                    .productName(product != null ? product.getName() : "Sản phẩm")
                    .sku(variant.getSku())
                    .variantName(((variant.getColor() != null ? variant.getColor() : "") + " "
                            + (variant.getSize() != null ? variant.getSize() : "")).trim())
                    .quantity(qty)
                    .unitPrice(variant.getFinalPrice())
                    .imageUrl(imageUrl)
                    .build();
            orderItem.calculateSubtotal();
            order.addItem(orderItem);
        }

        order.calculateTotals(order.getShippingFee());

        if (voucher != null) {
            if (!voucher.isValidForOrder(order.getSubtotalAmount())) {
                throw new BadRequestException("Mã giảm giá không đủ điều kiện áp dụng cho giá trị đơn hàng này.");
            }
            voucher.incrementUsage();
            voucherRepository.save(voucher);
        }

        Order savedOrder = orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(savedOrder)
                .paymentMethod(savedOrder.getPaymentMethod())
                .transactionId((savedOrder.getPaymentMethod() == PaymentMethod.COD ? "COD-" : "VNP-")
                        + savedOrder.getOrderCode())
                .amount(savedOrder.getFinalAmount())
                .status(savedOrder.getPaymentMethod() == PaymentMethod.COD
                        ? PaymentStatus.UNPAID
                        : PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        if (voucher != null && customer != null) {
            VoucherUsage usage = VoucherUsage.builder()
                    .voucher(voucher)
                    .user(customer)
                    .orderId(savedOrder.getId())
                    .build();
            voucherUsageRepository.save(usage);
        }

        String actor = resolveCurrentActor();
        for (OrderItem item : savedOrder.getItems()) {
            if (item.getProductVariant() != null) {
                InventoryAuditLog auditLog = InventoryAuditLog.builder()
                        .variant(item.getProductVariant())
                        .changeType(InventoryChangeType.ORDER_HOLD)
                        .quantityChanged(-item.getQuantity())
                        .balanceAfter(item.getProductVariant().getStockQuantity())
                        .reason("Tạo đơn đặt hộ #" + savedOrder.getOrderCode() + " cho khách: " + savedOrder.getShippingName())
                        .performedBy(actor)
                        .build();
                inventoryAuditLogRepository.save(auditLog);
            }
        }

        return convertToOrderResponse(savedOrder);
    }

    private String resolveCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String name = authentication.getName();
            if (name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name)) {
                return name;
            }
        }
        return "ADMIN";
    }

    private String generateOrderCode() {
        String date = DateTimeFormatter.BASIC_ISO_DATE.withZone(ZoneOffset.UTC).format(Instant.now());
        String suffix = UUID.randomUUID().toString().replace("-", "")
                .substring(0, 8).toUpperCase(Locale.ROOT);
        return "PS-" + date + "-" + suffix;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getOrders(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
        Page<Order> orderPage = orderRepository.findByUser(user, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        
        List<OrderResponse> responseList = new ArrayList<>();
        for (Order o : orderPage.getContent()) {
            responseList.add(convertToOrderResponse(o));
        }

        Page<OrderResponse> responsePage = new PageImpl<>(
                responseList, orderPage.getPageable(), orderPage.getTotalElements()
        );

        return PaginatedResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xem đơn hàng này.");
        }
        return convertToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền hủy đơn hàng này.");
        }
        if (!order.canCancel()) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng khi đang chờ xác nhận hoặc đã xác nhận.");
        }

        order.cancel();

        // Hoàn lại tồn kho
        restockOrderItems(order, "Khách hàng hủy đơn #" + order.getId(), order.getUser().getEmail());

        if (order.getVoucher() != null) {
            order.getVoucher().decrementUsage();
            voucherRepository.save(order.getVoucher());
            List<VoucherUsage> usages = voucherUsageRepository.findByOrderId(order.getId());
            if (usages != null && !usages.isEmpty()) {
                voucherUsageRepository.deleteAll(usages);
            }
        }

        Order saved = orderRepository.save(order);
        return convertToOrderResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getAllOrdersAdmin(OrderFilterDto filter, int page, int size) {
        OrderStatus status = filter.getStatus();
        PaymentStatus paymentStatus = filter.getPaymentStatus();
        PaymentMethod paymentMethod = filter.getPaymentMethod();
        BigDecimal minAmount = filter.getMinAmount();
        BigDecimal maxAmount = filter.getMaxAmount();
        if ((minAmount != null && minAmount.signum() < 0) || (maxAmount != null && maxAmount.signum() < 0)) {
            throw new BadRequestException("Giá trị đơn hàng không được âm.");
        }
        if (minAmount != null && maxAmount != null && minAmount.compareTo(maxAmount) > 0) {
            throw new BadRequestException("Giá trị đơn tối thiểu không được lớn hơn giá trị tối đa.");
        }
        
        Instant start = null;
        Instant end = null;
        if (filter.getFrom() != null || filter.getTo() != null) {
            if (filter.getFrom() != null && filter.getTo() != null && filter.getFrom().isAfter(filter.getTo())) {
                throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc.");
            }
            if (filter.getFrom() != null) {
                start = filter.getFrom().atStartOfDay(ZoneId.systemDefault()).toInstant();
            }
            if (filter.getTo() != null) {
                end = filter.getTo().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            }
        } else if (filter.getSpecificDay() != null) {
            start = filter.getSpecificDay().atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = filter.getSpecificDay().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else if (filter.getSpecificMonth() != null) {
            start = filter.getSpecificMonth().atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = filter.getSpecificMonth().plusMonths(1).atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        }

        final Instant finalStart = start;
        final Instant finalEnd = end;

        Specification<Order> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (paymentStatus != null) {
                predicates.add(criteriaBuilder.equal(root.get("paymentStatus"), paymentStatus));
            }
            if (paymentMethod != null) {
                predicates.add(criteriaBuilder.equal(root.get("paymentMethod"), paymentMethod));
            }
            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("finalAmount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("finalAmount"), maxAmount));
            }
            if (finalStart != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), finalStart));
            }
            if (finalEnd != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("createdAt"), finalEnd));
            }
            if (filter.getQuery() != null && !filter.getQuery().trim().isEmpty()) {
                String cleanQuery = filter.getQuery().trim();
                String pattern = "%" + cleanQuery.toLowerCase() + "%";
                Predicate orderCodeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("orderCode")), pattern);
                Predicate ghnOrderCodeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("ghnOrderCode")), pattern);
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("shippingName")), pattern);
                Predicate phoneLike = criteriaBuilder.like(root.get("shippingPhone"), pattern);
                Predicate finalSearchPred = criteriaBuilder.or(orderCodeLike, ghnOrderCodeLike, nameLike, phoneLike);
                try {
                    Long orderId = Long.parseLong(cleanQuery);
                    Predicate idEquals = criteriaBuilder.equal(root.get("id"), orderId);
                    finalSearchPred = criteriaBuilder.or(finalSearchPred, idEquals);
                } catch (NumberFormatException ignored) {}
                predicates.add(finalSearchPred);
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(
                page, size, Sort.by("createdAt").descending()
        );

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        
        List<OrderResponse> responseList = new ArrayList<>();
        for (Order o : orderPage.getContent()) {
            responseList.add(convertToOrderResponse(o));
        }

        Page<OrderResponse> responsePage = new PageImpl<>(
                responseList, pageable, orderPage.getTotalElements()
        );

        return PaginatedResponse.from(responsePage);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatusAdmin(Long id, OrderStatus nextStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", id));

        if (nextStatus == null) {
            throw new BadRequestException("Trạng thái đơn hàng không hợp lệ.");
        }

        if ((nextStatus == OrderStatus.SHIPPING || nextStatus == OrderStatus.DELIVERED)
                && shipmentRepository.findFirstByOrderOrderByCreatedAtDesc(order)
                .filter(shipment -> shipment.getStatus() != ShipmentStatus.CANCELLED
                        && shipment.getStatus() != ShipmentStatus.RETURNED)
                .isPresent()) {
            throw new BadRequestException("Đơn đã có vận đơn GHN; trạng thái giao hàng chỉ được cập nhật từ webhook GHN.");
        }

        if (nextStatus == OrderStatus.CANCELLED) {
            order.cancel("Quản trị viên hủy đơn hàng");
            restockOrderItems(order, "Admin hủy đơn #" + order.getId(), "ADMIN");
            if (order.getVoucher() != null) {
                order.getVoucher().decrementUsage();
                voucherRepository.save(order.getVoucher());
                List<VoucherUsage> usages = voucherUsageRepository.findByOrderId(order.getId());
                if (usages != null && !usages.isEmpty()) {
                    voucherUsageRepository.deleteAll(usages);
                }
            }
        } else {
            order.advanceStatus(nextStatus);
        }

        Order saved = orderRepository.save(order);
        return convertToOrderResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdAdmin(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", "id", id));
        return convertToOrderResponse(order);
    }

    private void restockOrderItems(Order order, String reason, String performedBy) {
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                if (item.getProductVariant() != null) {
                    ProductVariant variant = productVariantRepository.findByIdWithLock(item.getProductVariant().getId())
                            .orElse(item.getProductVariant());
                    variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                    productVariantRepository.save(variant);

                    // Hoàn lại lô hàng nhập theo FIFO
                    inventoryService.restoreBatchesFifo(variant.getId(), item.getQuantity());

                    InventoryAuditLog auditLog = InventoryAuditLog.builder()
                            .variant(variant)
                            .changeType(InventoryChangeType.RESTOCK)
                            .quantityChanged(item.getQuantity())
                            .balanceAfter(variant.getStockQuantity())
                            .reason(reason)
                            .performedBy(performedBy)
                            .build();
                    inventoryAuditLogRepository.save(auditLog);
                }
            }
        }
    }

    private String resolveProductImageUrl(Product product) {
        if (product != null && product.getImages() != null && !product.getImages().isEmpty()) {
            String imageUrl = product.getImages().stream()
                    .filter(Image::getIsPrimary)
                    .findFirst()
                    .map(this::resolveImageUrl)
                    .orElse(resolveImageUrl(product.getImages().get(0)));
            try {
                return imageUrl;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String resolveImageUrl(Image image) {
        String storedUrl = image.getImageUrl();
        return cloudinaryService.creteImageUrl(
                storedUrl != null && !storedUrl.isBlank() ? storedUrl : image.getImageName());
    }

    private OrderResponse convertToOrderResponse(Order order) {
        OrderReturn latestReturn = orderReturnRepository.findFirstByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String imageUrl = null;
                if (item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
                    imageUrl = resolveProductImageUrl(item.getProductVariant().getProduct());
                }

                itemResponses.add(OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductVariant() != null && item.getProductVariant().getProduct() != null 
                                ? item.getProductVariant().getProduct().getId() : null)
                        .productVariantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .variantName(item.getVariantName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .imageUrl((item.getImageUrl() != null && item.getImageUrl().startsWith("http")) ? item.getImageUrl() : 
                                  (item.getImageUrl() != null ? cloudinaryService.creteImageUrl(item.getImageUrl()) : imageUrl))
                        .build());
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null)
                .items(itemResponses)
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .ghnOrderCode(order.getGhnOrderCode())
                .ghnTrackingStatus(order.getGhnTrackingStatus())
                .shippingName(order.getShippingName())
                .shippingPhone(order.getShippingPhone())
                .shippingProvince(order.getShippingProvince())
                .shippingDistrict(order.getShippingDistrict())
                .shippingWard(order.getShippingWard())
                .shippingStreet(order.getShippingStreet())
                .note(order.getNote())
                .cancelReason(order.getCancelReason())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .deliveredAt(order.getDeliveredAt())
                .latestReturnId(latestReturn != null ? latestReturn.getId() : null)
                .latestReturnStatus(latestReturn != null ? latestReturn.getStatus() : null)
                .build();
    }

    @Override
    @Transactional
    public int cancelExpiredPendingOrders() {
        Instant cutoff = Instant.now().minus(15, ChronoUnit.MINUTES);
        List<Order> expiredOrders = orderRepository.findExpiredPendingOrders(cutoff);
        if (expiredOrders.isEmpty()) {
            return 0;
        }

        int count = 0;
        for (Order order : expiredOrders) {
            try {
                order.cancel("Hệ thống tự động hủy đơn quá hạn thanh toán VNPay (15 phút)");
                restockOrderItems(order, "Tự động hoàn kho do đơn VNPay quá hạn 15 phút", "SYSTEM");
                if (order.getVoucher() != null) {
                    order.getVoucher().decrementUsage();
                    voucherRepository.save(order.getVoucher());
                    List<VoucherUsage> usages = voucherUsageRepository.findByOrderId(order.getId());
                    if (usages != null && !usages.isEmpty()) {
                        voucherUsageRepository.deleteAll(usages);
                    }
                }
                orderRepository.save(order);
                count++;
                log.info("Đã tự động hủy đơn hàng VNPay quá hạn #{} (Mã: {})", order.getId(), order.getOrderCode());
            } catch (Exception ex) {
                log.error("Lỗi khi tự động hủy đơn quá hạn #{}: {}", order.getId(), ex.getMessage());
            }
        }
        return count;
    }
}
