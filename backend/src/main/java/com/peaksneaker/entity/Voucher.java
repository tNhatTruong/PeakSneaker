package com.peaksneaker.entity;

import com.peaksneaker.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vouchers")
@SQLDelete(sql = "UPDATE vouchers SET is_deleted = true WHERE id=?")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, columnDefinition = "varchar(50)")
    private DiscountType discountType; // PERCENTAGE | FIXED

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

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "expire_at")
    private Instant expireAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isDeleted = false;

    // Kiểm tra xem mã giảm giá đã hết hạn hoặc chưa bắt đầu hiệu lực
    public boolean isExpired() {
        Instant now = Instant.now();
        if (this.startAt != null && now.isBefore(this.startAt)) {
            return true;
        }
        if (this.expireAt != null && now.isAfter(this.expireAt)) {
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

        BigDecimal discount;

        switch (this.discountType) {
            case PERCENTAGE:
                // Tính số tiền giảm theo phần trăm
                BigDecimal fraction = this.discountValue.divide(BigDecimal.valueOf(100));
                discount = orderSubtotal.multiply(fraction);
                // Áp trần giảm giá tối đa nếu có
                if (this.maxDiscountAmount != null
                        && discount.compareTo(this.maxDiscountAmount) > 0) {
                    discount = this.maxDiscountAmount;
                }
                break;
            case FIXED:
                // Giảm một số tiền cố định
                discount = this.discountValue;
                break;
            default:
                throw new IllegalStateException("Loại giảm giá không hợp lệ: " + this.discountType);
        }
        // Đảm bảo giảm giá không vượt quá tổng đơn hàng
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

