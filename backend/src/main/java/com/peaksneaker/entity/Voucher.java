package com.peaksneaker.entity;

import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.VoucherApplicationScope;
import com.peaksneaker.enums.VoucherChannel;
import com.peaksneaker.enums.VoucherStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Entity
@Table(name = "vouchers")
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

    @Column(nullable = false, length = 160)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType; // PERCENTAGE | FIXED_AMOUNT | FIXED

    @Enumerated(EnumType.STRING)
    @Column(name = "application_scope", nullable = false, length = 30)
    @Builder.Default
    private VoucherApplicationScope applicationScope = VoucherApplicationScope.ALL_PRODUCTS;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_channel", nullable = false, length = 20)
    @Builder.Default
    private VoucherChannel applicationChannel = VoucherChannel.WEB;

    @Column(name = "is_combinable", nullable = false)
    @Builder.Default
    private Boolean isCombinable = false;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "min_order_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "per_user_limit", nullable = false)
    @Builder.Default
    private Integer perUserLimit = 1;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "expire_at", nullable = false)
    private Instant expireAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Transient
    @Builder.Default
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (minOrderAmount == null) {
            minOrderAmount = BigDecimal.ZERO;
        }
        if (usedCount == null) {
            usedCount = 0;
        }
        if (perUserLimit == null) {
            perUserLimit = 1;
        }
        if (applicationScope == null) {
            applicationScope = VoucherApplicationScope.ALL_PRODUCTS;
        }
        if (applicationChannel == null) {
            applicationChannel = VoucherChannel.WEB;
        }
        if (isCombinable == null) {
            isCombinable = false;
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

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

    public VoucherStatus getStatus() {
        if (Boolean.FALSE.equals(this.isActive)) {
            return VoucherStatus.PAUSED;
        }

        Instant now = Instant.now();
        if (this.startAt != null && now.isBefore(this.startAt)) {
            return VoucherStatus.UPCOMING;
        }
        if ((this.expireAt != null && now.isAfter(this.expireAt)) || isLimitReached()) {
            return VoucherStatus.EXPIRED;
        }
        return VoucherStatus.ACTIVE;
    }

    public boolean isLimitReached() {
        return this.usageLimit != null && this.usedCount >= this.usageLimit;
    }

    public boolean isValidForOrder(BigDecimal orderSubtotal) {
        if (orderSubtotal == null) return false;

        if (this.isActive == null || !this.isActive) {
            return false;
        }
        if (isExpired()) {
            return false;
        }
        if (isLimitReached()) {
            return false;
        }
        if (this.minOrderAmount != null && orderSubtotal.compareTo(this.minOrderAmount) < 0) {
            return false;
        }
        return true;
    }

    public BigDecimal calculateDiscount(BigDecimal orderSubtotal) {
        if (orderSubtotal == null || !isValidForOrder(orderSubtotal)) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;

        switch (this.discountType) {
            case PERCENTAGE:
                BigDecimal fraction = this.discountValue.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                discount = orderSubtotal.multiply(fraction);
                if (this.maxDiscountAmount != null && discount.compareTo(this.maxDiscountAmount) > 0) {
                    discount = this.maxDiscountAmount;
                }
                break;
            case FIXED_AMOUNT:
            case FIXED:
                discount = this.discountValue;
                break;
            default:
                throw new IllegalStateException("Loại giảm giá không hợp lệ: " + this.discountType);
        }

        if (discount.compareTo(orderSubtotal) > 0) {
            discount = orderSubtotal;
        }

        return discount;
    }

    public void incrementUsage() {
        if (isLimitReached()) {
            throw new IllegalStateException("Mã giảm giá đã đạt giới hạn lượt sử dụng tối đa.");
        }
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
        this.usedCount++;
    }

    public void decrementUsage() {
        if (this.usedCount != null && this.usedCount > 0) {
            this.usedCount--;
        }
    }
}
