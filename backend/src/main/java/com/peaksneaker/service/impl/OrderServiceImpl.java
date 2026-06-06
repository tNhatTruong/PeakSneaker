package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.entity.*;
import com.peaksneaker.repository.*;
import com.peaksneaker.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
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

    @Override
    @Transactional(readOnly = true)
    public com.peaksneaker.dto.response.PaginatedResponse<Order> getOrders(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        org.springframework.data.domain.Page<Order> orderPage = orderRepository.findByUser(user, org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending()));
        return com.peaksneaker.dto.response.PaginatedResponse.from(orderPage);
    }
}
