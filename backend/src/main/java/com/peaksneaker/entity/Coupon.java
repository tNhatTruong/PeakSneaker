package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType; // PERCENTAGE | FIXED

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "min_order_amount", precision = 12, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    // Kiểm tra xem mã giảm giá đã hết hạn hoặc chưa bắt đầu hiệu lực
    public boolean isExpired() {
        Instant now = Instant.now();
        if (this.startsAt != null && now.isBefore(this.startsAt)) {
            return true;
        }
        if (this.expiresAt != null && now.isAfter(this.expiresAt)) {
            return true;
        }
        return false;
    }

    // Kiểm tra xem mã giảm giá đã chạm giới hạn lượt sử dụng tối đa chưa
    public boolean isLimitReached() {
        return this.usageLimit != null && this.usedCount >= this.usageLimit;
    }

    // Kiểm tra toàn diện: coupon có được áp dụng cho đơn hàng này không
    public boolean isValidForOrder(BigDecimal orderSubtotal) {
        if (orderSubtotal == null) return false;

        // kiểm tra trạng thái kích hoạt
        if (this.isActive == null || !this.isActive) {
            return false;
        }

        // kiểm tra thời hạn hiệu lực
        if (isExpired()) {
            return false;
        }

        // kiểm tra giới hạn lượt dùng
        if (isLimitReached()) {
            return false;
        }

        // kiểm tra giá trị đơn hàng tối thiểu
        if (this.minOrderAmount != null && orderSubtotal.compareTo(this.minOrderAmount) < 0) {
            return false;
        }

        return true;
    }

    // Tính số tiền được giảm thực tế; trả về 0 nếu coupon không hợp lệ
    public BigDecimal calculateDiscount(BigDecimal orderSubtotal) {
        if (orderSubtotal == null || !isValidForOrder(orderSubtotal)) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;

        if ("PERCENTAGE".equalsIgnoreCase(this.discountType)) {
            // tính số tiền giảm theo phần trăm
            BigDecimal fraction = this.discountValue.divide(BigDecimal.valueOf(100));
            discount = orderSubtotal.multiply(fraction);
            // áp trần giảm giá tối đa nếu có
            if (this.maxDiscountAmount != null && discount.compareTo(this.maxDiscountAmount) > 0) {
                discount = this.maxDiscountAmount;
            }
        } else if ("FIXED".equalsIgnoreCase(this.discountType)) {
            // giảm một số tiền cố định
            discount = this.discountValue;
        }

        // đảm bảo giảm giá không vượt quá tổng đơn hàng
        if (discount.compareTo(orderSubtotal) > 0) {
            discount = orderSubtotal;
        }

        return discount;
    }

    // Tăng số lượt đã dùng sau khi coupon được áp dụng thành công
    public void incrementUsage() {
        if (isLimitReached()) {
            throw new IllegalStateException("Mã giảm giá đã đạt giới hạn lượt sử dụng tối đa.");
        }
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
        this.usedCount++;
    }
}

