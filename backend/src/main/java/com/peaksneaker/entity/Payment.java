package com.peaksneaker.entity;

import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethod paymentMethod;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "provider_response", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String providerResponse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void markSuccess(String transactionId) {
        this.transactionId = transactionId;
        this.status = PaymentStatus.PAID;
        this.paidAt = Instant.now();
        if (this.order != null) {
            this.order.setPaymentStatus(PaymentStatus.PAID);
        }
    }

    public void markFailed() {
        this.status = PaymentStatus.FAILED;
        if (this.order != null) {
            this.order.setPaymentStatus(PaymentStatus.FAILED);
        }
    }

    public void markRefunded() {
        this.status = PaymentStatus.REFUNDED;
        if (this.order != null) {
            this.order.setPaymentStatus(PaymentStatus.REFUNDED);
        }
    }
}
