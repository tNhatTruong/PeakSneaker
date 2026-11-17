package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "order_return_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_order_return_item",
                columnNames = {"order_return_id", "order_item_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_return_id", nullable = false)
    private OrderReturn orderReturn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Column(name = "approved_quantity", nullable = false)
    @Builder.Default
    private Integer approvedQuantity = 0;

    @Column(name = "received_quantity", nullable = false)
    @Builder.Default
    private Integer receivedQuantity = 0;

    @Column(name = "restockable_quantity", nullable = false)
    @Builder.Default
    private Integer restockableQuantity = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_variant_id")
    private ProductVariant replacementVariant;

    @Column(name = "condition_note", columnDefinition = "text")
    private String conditionNote;

    @Column(name = "restocked_at")
    private Instant restockedAt;
}
