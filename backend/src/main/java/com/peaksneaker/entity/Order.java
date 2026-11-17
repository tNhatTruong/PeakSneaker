package com.peaksneaker.entity;

import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @Column(name = "checkout_key", unique = true, length = 64)
    private String checkoutKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 50)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Column(name = "ghn_order_code", length = 100)
    private String ghnOrderCode;

    @Column(name = "ghn_tracking_status", length = 100)
    private String ghnTrackingStatus;

    @Column(name = "shipping_name", nullable = false, length = 100)
    private String shippingName;

    @Column(name = "shipping_phone", nullable = false, length = 20)
    private String shippingPhone;

    @Column(name = "shipping_province", nullable = false, length = 100)
    private String shippingProvince;

    @Column(name = "shipping_district", nullable = false, length = 100)
    private String shippingDistrict;

    @Column(name = "shipping_district_id")
    private Integer shippingDistrictId;

    @Column(name = "shipping_ward", nullable = false, length = 100)
    private String shippingWard;

    @Column(name = "shipping_ward_code", length = 30)
    private String shippingWardCode;

    @Column(name = "shipping_street", nullable = false, columnDefinition = "text")
    private String shippingStreet;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "cancel_reason", columnDefinition = "text")
    private String cancelReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (discountAmount == null) {
            discountAmount = BigDecimal.ZERO;
        }
        if (shippingFee == null) {
            shippingFee = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Vật phẩm đơn hàng không được null.");
        }
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        item.setOrder(this);
        this.items.add(item);
    }

    public void calculateTotals(BigDecimal shippingFee) {
        if (shippingFee != null) {
            this.shippingFee = shippingFee;
        }

        if (this.items == null || this.items.isEmpty()) {
            this.subtotalAmount = BigDecimal.ZERO;
            this.discountAmount = BigDecimal.ZERO;
            this.finalAmount = this.shippingFee != null ? this.shippingFee : BigDecimal.ZERO;
            return;
        }

        this.subtotalAmount = this.items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (this.voucher != null) {
            this.discountAmount = this.voucher.calculateDiscount(this.subtotalAmount);
        } else {
            this.discountAmount = BigDecimal.ZERO;
        }

        BigDecimal finalVal = this.subtotalAmount.subtract(this.discountAmount).add(this.shippingFee != null ? this.shippingFee : BigDecimal.ZERO);
        this.finalAmount = finalVal.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : finalVal;
    }

    public boolean canCancel() {
        return this.status == OrderStatus.PENDING || this.status == OrderStatus.CONFIRMED;
    }

    public boolean canTransitionTo(OrderStatus nextStatus) {
        if (nextStatus == null || nextStatus == this.status) {
            return false;
        }

        return switch (this.status) {
            case PENDING -> nextStatus == OrderStatus.CONFIRMED || nextStatus == OrderStatus.CANCELLED;
            case CONFIRMED -> nextStatus == OrderStatus.PROCESSING || nextStatus == OrderStatus.CANCELLED;
            case PROCESSING -> nextStatus == OrderStatus.SHIPPING;
            case SHIPPING -> nextStatus == OrderStatus.DELIVERED;
            case DELIVERED -> nextStatus == OrderStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public void cancel() {
        cancel("Khách hàng yêu cầu hủy đơn");
    }

    public void cancel(String reason) {
        if (!canCancel()) {
            throw new IllegalStateException("Không thể hủy đơn hàng ở trạng thái hiện tại: " + this.status);
        }
        this.status = OrderStatus.CANCELLED;
        this.cancelReason = reason;
    }

    public void cancelAfterCarrierReturn(String reason) {
        if (this.status != OrderStatus.SHIPPING && this.status != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Chỉ có thể đóng đơn hoàn vận khi đơn đang giao hoặc đã giao.");
        }
        this.status = OrderStatus.CANCELLED;
        this.cancelReason = reason;
    }

    public void advanceStatus(OrderStatus nextStatus) {
        if (!canTransitionTo(nextStatus) || nextStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Không thể chuyển trạng thái đơn hàng từ " + this.status + " sang " + nextStatus + ".");
        }

        this.status = nextStatus;
        if (nextStatus == OrderStatus.DELIVERED && deliveredAt == null) {
            deliveredAt = Instant.now();
        }
    }

    public void updatePaymentStatus(PaymentStatus nextPaymentStatus) {
        if (nextPaymentStatus != null) {
            this.paymentStatus = nextPaymentStatus;
        }
    }
}
