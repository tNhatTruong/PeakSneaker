package com.peaksneaker.entity;

import com.peaksneaker.enums.ReturnStatus;
import com.peaksneaker.enums.ReturnType;
import com.peaksneaker.enums.ReturnReasonCode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_returns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "orderReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderReturnItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "return_type", nullable = false, length = 50)
    private ReturnType returnType;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_code", nullable = false, length = 50)
    @Builder.Default
    private ReturnReasonCode reasonCode = ReturnReasonCode.OTHER;

    @Column(nullable = false, columnDefinition = "text")
    private String reason;

    @Column(name = "evidence_images", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String evidenceImages;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ReturnStatus status = ReturnStatus.REQUESTED;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "admin_notes", columnDefinition = "text")
    private String adminNotes;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

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
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addItem(OrderReturnItem item) {
        item.setOrderReturn(this);
        items.add(item);
    }
}
