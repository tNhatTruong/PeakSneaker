package com.peaksneaker.entity;

import com.peaksneaker.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String provider = "GHN";

    @Column(name = "provider_order_code", nullable = false, unique = true, length = 100)
    private String providerOrderCode;

    @Column(name = "client_order_code", nullable = false, length = 50)
    private String clientOrderCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ShipmentStatus status;

    @Column(name = "provider_status", nullable = false, length = 100)
    private String providerStatus;

    @Column(name = "cod_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal codAmount = BigDecimal.ZERO;

    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "expected_delivery_at")
    private Instant expectedDeliveryAt;

    @Column(name = "last_event_at")
    private Instant lastEventAt;

    @Column(name = "restocked_at")
    private Instant restockedAt;

    @Column(name = "provider_response", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String providerResponse;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("occurredAt ASC, id ASC")
    @Builder.Default
    private List<ShipmentEvent> events = new ArrayList<>();

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
