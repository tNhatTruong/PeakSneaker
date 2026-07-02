package com.peaksneaker.service;

import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.request.OrderFilterDto;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.OrderResponse;
import com.peaksneaker.dto.response.OrderItemResponse;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.entity.*;
import com.peaksneaker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional
    public Order checkout(Long userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Giỏ hàng trống."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Không có sản phẩm nào trong giỏ hàng.");
        }

        Address address = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Địa chỉ giao hàng không hợp lệ hoặc không thuộc về bạn."));

        Voucher voucher = null;
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            voucher = voucherRepository.findByCode(request.getVoucherCode())
                    .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không hợp lệ."));
            if (!voucher.getIsActive() || voucher.isExpired() || voucher.isLimitReached()) {
                throw new IllegalArgumentException("Mã giảm giá đã hết hạn hoặc hết lượt sử dụng.");
            }
        }

        Order order = Order.builder()
                .user(user)
                .voucher(voucher)
                .shippingName(address.getRecipientName())
                .shippingPhone(address.getPhone())
                .shippingProvince(address.getProvinceName())
                .shippingDistrict(address.getDistrictName())
                .shippingWard(address.getWardName())
                .shippingStreet(address.getStreetDetail())
                .note(request.getNote())
                .shippingFee(new BigDecimal("30000")) // Phí vận chuyển mặc định tạm thời
                .build();

        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = cartItem.getProductVariant();
            Product product = variant.getProduct();
            OrderItem orderItem = OrderItem.builder()
                    .productVariant(variant)
                    .productName(product != null ? product.getName() : "Sản phẩm")
                    .sku(variant.getSku())
                    .variantName((variant.getColor() != null ? variant.getColor() : "") + " " + (variant.getSize() != null ? variant.getSize() : ""))
                    .quantity(cartItem.getQuantity())
                    .unitPrice(variant.getFinalPrice())
                    .build();
            orderItem.calculateSubtotal();
            order.addItem(orderItem);
        }

        order.calculateTotals(order.getShippingFee());

        if (voucher != null) {
            voucher.incrementUsage();
            voucherRepository.save(voucher);
        }

        Order savedOrder = orderRepository.save(order);

        cart.clear();
        cartRepository.save(cart);

        return savedOrder;
    }


    @Transactional(readOnly = true)
    public PaginatedResponse<Order> getOrders(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        Page<Order> orderPage = orderRepository.findByUser(user, org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending()));
        return com.peaksneaker.dto.response.PaginatedResponse.from(orderPage);
    }

    private OrderResponse convertToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = new java.util.ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                itemResponses.add(OrderItemResponse.builder()
                        .id(item.getId())
                        .productVariantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .variantName(item.getVariantName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build());
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null)
                .items(itemResponses)
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .shippingName(order.getShippingName())
                .shippingPhone(order.getShippingPhone())
                .shippingProvince(order.getShippingProvince())
                .shippingDistrict(order.getShippingDistrict())
                .shippingWard(order.getShippingWard())
                .shippingStreet(order.getShippingStreet())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getAllOrdersAdmin(OrderFilterDto filter, int page, int size) {
        OrderStatus status = filter.getStatus();
        
        Instant start = null;
        Instant end = null;
        if (filter.getSpecificDay() != null) {
            start = filter.getSpecificDay().atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = filter.getSpecificDay().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else if (filter.getSpecificMonth() != null) {
            start = filter.getSpecificMonth().atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = filter.getSpecificMonth().plusMonths(1).atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        }

        final Instant finalStart = start;
        final Instant finalEnd = end;

        org.springframework.data.jpa.domain.Specification<Order> spec = (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
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
                jakarta.persistence.criteria.Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("shippingName")), pattern);
                jakarta.persistence.criteria.Predicate phoneLike = criteriaBuilder.like(root.get("shippingPhone"), pattern);
                jakarta.persistence.criteria.Predicate finalSearchPred = criteriaBuilder.or(nameLike, phoneLike);
                try {
                    Long orderId = Long.parseLong(cleanQuery);
                    jakarta.persistence.criteria.Predicate idEquals = criteriaBuilder.equal(root.get("id"), orderId);
                    finalSearchPred = criteriaBuilder.or(finalSearchPred, idEquals);
                } catch (NumberFormatException ignored) {}
                predicates.add(finalSearchPred);
            }
            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Pageable pageable = PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("createdAt").descending()
        );

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        
        List<OrderResponse> responseList = new java.util.ArrayList<>();
        for (Order o : orderPage.getContent()) {
            responseList.add(convertToOrderResponse(o));
        }

        Page<OrderResponse> responsePage = new org.springframework.data.domain.PageImpl<>(
                responseList, pageable, orderPage.getTotalElements()
        );

        return PaginatedResponse.from(responsePage);
    }

    @Transactional
    public OrderResponse updateOrderStatusAdmin(Long id, OrderStatus nextStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với id: " + id));

        if (nextStatus == null) {
            throw new IllegalArgumentException("Trạng thái đơn hàng không hợp lệ.");
        }

        if (nextStatus == OrderStatus.CANCELLED) {
            order.cancel();
        } else {
            order.advanceStatus(nextStatus);
        }

        Order saved = orderRepository.save(order);
        return convertToOrderResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdAdmin(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng với id: " + id));
        return convertToOrderResponse(order);
    }
}
