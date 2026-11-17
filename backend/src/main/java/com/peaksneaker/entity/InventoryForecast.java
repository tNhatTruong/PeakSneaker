package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inventory_forecasts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "sales_velocity", nullable = false, precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal salesVelocity = BigDecimal.ZERO;

    @Column(name = "days_until_out_of_stock")
    private Integer daysUntilOutOfStock;

    @Column(name = "forecast_period", nullable = false, length = 50)
    private String forecastPeriod;

    @Column(name = "predicted_demand", nullable = false)
    private Integer predictedDemand;

    @Column(name = "reorder_point", nullable = false)
    private Integer reorderPoint;

    @Column(name = "suggested_po_quantity", nullable = false)
    private Integer suggestedPoQuantity;

    @Column(name = "is_deadstock", nullable = false)
    @Builder.Default
    private Boolean isDeadstock = false;

    @Column(name = "recommended_discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal recommendedDiscountPercent = BigDecimal.ZERO;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String algorithm = "EXPONENTIAL_SMOOTHING";

    @Column(name = "generated_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant generatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = Instant.now();
        }
    }
}
