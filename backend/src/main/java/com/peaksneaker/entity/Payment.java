package com.peaksneaker.entity;

import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
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
    private PaymentMethod paymentMethod; // COD | VNPAY

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING; // PENDING | SUCCESS | FAILED | REFUNDED

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();


    // Xác nhận thanh toán thành công
    public void markSuccess(String transactionId) {
        this.transactionId = transactionId;
        this.status = PaymentStatus.PAID;
        this.paidAt = Instant.now();

        if (this.order != null) {
            this.order.updatePaymentStatus(PaymentStatus.PAID);
        }
    }

    // Đánh dấu giao dịch thất bại
    public void markFailed() {
        this.status = PaymentStatus.FAILED;

        if (this.order != null) {
            this.order.updatePaymentStatus(PaymentStatus.FAILED);
        }
    }

    // Thực hiện hoàn tiền
    public void markRefunded() {
        this.status = PaymentStatus.REFUNDED;

        if (this.order != null) {
            this.order.updatePaymentStatus(PaymentStatus.REFUNDED);
        }
    }
}

