package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

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
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<OrderItem> items = new java.util.ArrayList<>();

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

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

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING | CONFIRMED | SHIPPING | COMPLETED | CANCELLED

    @Column(name = "payment_status", nullable = false, length = 50)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING | PAID | FAILED | REFUNDED

    @Column(name = "shipping_name", nullable = false)
    private String shippingName;

    @Column(name = "shipping_phone", nullable = false, length = 50)
    private String shippingPhone;

    @Column(name = "shipping_address", nullable = false, columnDefinition = "text")
    private String shippingAddress;

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

        // áp dụng giảm giá coupon nếu có
        if (this.coupon != null) {
            this.couponCode = this.coupon.getCode();
            this.discountAmount = this.coupon.calculateDiscount(this.subtotalAmount);
        } else {
            this.discountAmount = BigDecimal.ZERO;
        }

        // tính tổng tiền thanh toán cuối cùng
        BigDecimal finalVal = this.subtotalAmount.subtract(this.discountAmount).add(this.shippingFee != null ? this.shippingFee : BigDecimal.ZERO);
        this.finalAmount = finalVal.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : finalVal;
    }

    // Trả về true nếu đơn hàng có thể bị hủy (chỉ khi PENDING hoặc CONFIRMED)
    public boolean canCancel() {
        return "PENDING".equalsIgnoreCase(this.status) || "CONFIRMED".equalsIgnoreCase(this.status);
    }

    // Hủy đơn hàng và hoàn trả tồn kho nếu đơn đã được xác nhận trước đó
    public void cancel() {
        if (!canCancel()) {
            throw new IllegalStateException("Không thể hủy đơn hàng ở trạng thái hiện tại: " + this.status);
        }

        // nếu đơn đã được xác nhận thì kho đã bị trừ, phải hoàn trả lại
        if ("CONFIRMED".equalsIgnoreCase(this.status) && this.items != null) {
            for (OrderItem item : this.items) {
                if (item.getProductVariant() != null) {
                    item.getProductVariant().increaseStock(item.getQuantity());
                }
            }
        }

        this.status = "CANCELLED";
    }

    // Điều phối trạng thái đơn hàng theo luồng: PENDING -> CONFIRMED -> SHIPPING -> COMPLETED
    public void advanceStatus(String nextStatus) {
        if (nextStatus == null) return;

        String upperNext = nextStatus.toUpperCase();

        if ("CANCELLED".equals(this.status) || "COMPLETED".equals(this.status)) {
            throw new IllegalStateException("Không thể chuyển đổi trạng thái của đơn hàng đã hủy hoặc đã hoàn tất.");
        }

        switch (upperNext) {
            case "CONFIRMED":
                if (!"PENDING".equalsIgnoreCase(this.status)) {
                    throw new IllegalStateException("ʤChỉ đơn hàng ở trạng thái PENDING mới có thể xác nhận (CONFIRMED).");
                }
                // xác nhận đơn: trừ tồn kho các biến thể vật lý
                if (this.items != null) {
                    for (OrderItem item : this.items) {
                        if (item.getProductVariant() != null) {
                            item.getProductVariant().decreaseStock(item.getQuantity());
                        }
                    }
                }
                this.status = "CONFIRMED";
                break;

            case "SHIPPING":
                if (!"CONFIRMED".equalsIgnoreCase(this.status)) {
                    throw new IllegalStateException("Đơn hàng phải được xác nhận (CONFIRMED) trước khi bàn giao vận chuyển (SHIPPING).");
                }
                this.status = "SHIPPING";
                break;

            case "COMPLETED":
                if (!"SHIPPING".equalsIgnoreCase(this.status)) {
                    throw new IllegalStateException("Đơn hàng phải đang trong trạng thái giao (SHIPPING) mới có thể đánh dấu hoàn tất (COMPLETED).");
                }
                this.status = "COMPLETED";
                break;

            default:
                throw new IllegalArgumentException("Trạng thái chuyển tiếp đơn hàng không hợp lệ: " + nextStatus);
        }
    }

    // Điều chỉnh trạng thái thanh toán của đơn hàng theo luồng hợp lệ
    public void updatePaymentStatus(String nextPaymentStatus) {
        if (nextPaymentStatus == null) return;
        String upperNext = nextPaymentStatus.toUpperCase();
        
        switch (upperNext) {
            case "PENDING":
                this.paymentStatus = "PENDING";
                break;
            case "PAID":
                this.paymentStatus = "PAID";
                break;
            case "FAILED":
                this.paymentStatus = "FAILED";
                break;
            case "REFUNDED":
                if (!"PAID".equalsIgnoreCase(this.paymentStatus)) {
                    throw new IllegalStateException("Chỉ có thể hoàn tiền (REFUNDED) đối với đơn hàng đã thanh toán thành công (PAID).");
                }
                this.paymentStatus = "REFUNDED";
                break;
            default:
                throw new IllegalArgumentException("Trạng thái thanh toán không hợp lệ: " + nextPaymentStatus);
        }
    }
}
