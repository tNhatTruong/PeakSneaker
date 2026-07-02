package com.peaksneaker.entity;

import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<OrderItem> items = new java.util.ArrayList<>();

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
    @Column(nullable = false,columnDefinition = "varchar(50)")
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING; // PENDING | SHIPPING | COMPLETED | CANCELLED

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", columnDefinition = "varchar(50)",nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING; // PENDING | PAID | FAILED | REFUNDED

    @Column(name = "shipping_name", nullable = false)
    private String shippingName;

    @Column(name = "shipping_phone", nullable = false, length = 50)
    private String shippingPhone;

    @Column(name = "shipping_province", nullable = false, length = 100)
    private String shippingProvince;

    @Column(name = "shipping_district", nullable = false, length = 100)
    private String shippingDistrict;

    @Column(name = "shipping_ward", nullable = false, length = 100)
    private String shippingWard;

    @Column(name = "shipping_street", nullable = false, columnDefinition = "text")
    private String shippingStreet;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Thêm vật phẩm vào đơn hàng và thiết lập quan hệ hai chiều
    public void addItem(OrderItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Vật phẩm đơn hàng không được null.");
        }
        if (this.items == null) {
            this.items = new java.util.ArrayList<>();
        }
        item.setOrder(this);
        this.items.add(item);
    }

    // Tính tự động các khoản tiền của đơn: tổng tạm tính, giảm giá coupon, phí vận chuyển và tổng cuối
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

        // tính tổng tạm tính từ danh sách món hàng
        this.subtotalAmount = this.items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // áp dụng giảm giá voucher nếu có
        if (this.voucher != null) {
            this.discountAmount = this.voucher.calculateDiscount(this.subtotalAmount);
        } else {
            this.discountAmount = BigDecimal.ZERO;
        }

        // tính tổng tiền thanh toán cuối cùng
        BigDecimal finalVal = this.subtotalAmount.subtract(this.discountAmount).add(this.shippingFee != null ? this.shippingFee : BigDecimal.ZERO);
        this.finalAmount = finalVal.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : finalVal;
    }

    // Trả về true nếu đơn hàng có thể bị hủy (chỉ khi PENDING)
    public boolean canCancel() {
        return this.status == OrderStatus.PENDING;
    }

    // Hủy đơn hàng
    public void cancel() {
        if (!canCancel()) {
            throw new IllegalStateException(
                    "Không thể hủy đơn hàng ở trạng thái hiện tại: " + this.status);
        }

        // Chỉ cho hủy khi PENDING nên chưa cần hoàn kho
        this.status = OrderStatus.CANCELLED;
    }

    // Chuyển trạng thái đơn hàng
    public void advanceStatus(OrderStatus nextStatus) {
        if (nextStatus == null) {
            return;
        }

        if (this.status == OrderStatus.CANCELLED
                || this.status == OrderStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Không thể chuyển đổi trạng thái của đơn hàng đã hủy hoặc đã hoàn tất.");
        }

        switch (nextStatus) {

            case SHIPPING:
                if (this.status != OrderStatus.PENDING) {
                    throw new IllegalStateException(
                            "Chỉ đơn hàng PENDING mới có thể chuyển sang SHIPPING.");
                }

                // Trừ tồn kho
                if (this.items != null) {
                    for (OrderItem item : this.items) {
                        if (item.getProductVariant() != null) {
                            item.getProductVariant().decreaseStock(item.getQuantity());
                        }
                    }
                }

                this.status = OrderStatus.SHIPPING;
                break;

            case COMPLETED:
                if (this.status != OrderStatus.SHIPPING) {
                    throw new IllegalStateException(
                            "Đơn hàng phải đang ở trạng thái SHIPPING mới có thể COMPLETED.");
                }

                this.status = OrderStatus.COMPLETED;
                break;

            default:
                throw new IllegalArgumentException(
                        "Trạng thái chuyển tiếp không hợp lệ: " + nextStatus);
        }
    }

    // Cập nhật trạng thái thanh toán
    public void updatePaymentStatus(PaymentStatus nextPaymentStatus) {
        if (nextPaymentStatus == null) {
            return;
        }

        switch (nextPaymentStatus) {

            case PENDING:
                this.paymentStatus = PaymentStatus.PENDING;
                break;

            case PAID:
                this.paymentStatus = PaymentStatus.PAID;
                break;

            case FAILED:
                this.paymentStatus = PaymentStatus.FAILED;
                break;

            case REFUNDED:
                if (this.paymentStatus != PaymentStatus.PAID) {
                    throw new IllegalStateException(
                            "Chỉ có thể hoàn tiền đối với đơn hàng đã thanh toán.");
                }

                this.paymentStatus = PaymentStatus.REFUNDED;
                break;

            default:
                throw new IllegalArgumentException(
                        "Trạng thái thanh toán không hợp lệ: " + nextPaymentStatus);
        }
    }
}
