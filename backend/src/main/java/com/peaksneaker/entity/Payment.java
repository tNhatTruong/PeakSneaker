package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 100)
    private String paymentMethod; // COD | VNPAY

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING | SUCCESS | FAILED | REFUNDED

    @Column(name = "paid_at")
    private Instant paidAt;

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

    // Xác nhận thanh toán thành công, ghi lại mã giao dịch và cập nhật trạng thái đơn hàng
    public void markSuccess(String transactionId) {
        this.transactionId = transactionId;
        this.status = "SUCCESS";
        this.paidAt = Instant.now();
        
        if (this.order != null) {
            this.order.updatePaymentStatus("PAID");
        }
    }

    // Đánh dấu giao dịch thất bại và cập nhật trạng thái thanh toán của đơn hàng
    public void markFailed() {
        this.status = "FAILED";
        if (this.order != null) {
            this.order.updatePaymentStatus("FAILED");
        }
    }

    // Thực hiện hoàn tiền và cập nhật trạng thái thanh toán của đơn hàng
    public void markRefunded() {
        this.status = "REFUNDED";
        if (this.order != null) {
            this.order.updatePaymentStatus("REFUNDED");
        }
    }
}

