package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants", uniqueConstraints = {
    @UniqueConstraint(name = "uk_variant_product_color_size", columnNames = {"product_id", "color", "size"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 100)
    private String color;

    @Column(name = "color_code", length = 20)
    private String colorCode;

    @Column(nullable = false, length = 50)
    private String size;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "safety_stock_threshold", nullable = false)
    @Builder.Default
    private Integer safetyStockThreshold = 5;

    @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String attributes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @ManyToMany
    @JoinTable(
            name = "product_variant_images",
            joinColumns = @JoinColumn(name = "product_variant_id"),
            inverseJoinColumns = @JoinColumn(name = "image_id")
    )
    @Builder.Default
    private List<Image> images = new ArrayList<>();

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

    public BigDecimal getOriginalPrice() {
        if (this.product == null) {
            throw new IllegalStateException("Biến thể chưa được liên kết với sản phẩm.");
        }
        BigDecimal base = this.product.getBasePrice();
        if (base == null) {
            return BigDecimal.ZERO;
        }
        return base.add(this.priceAdjustment != null ? this.priceAdjustment : BigDecimal.ZERO);
    }

    public BigDecimal getFinalPrice() {
        BigDecimal original = getOriginalPrice();
        if (this.product != null && this.product.getDiscountPercent() != null 
                && this.product.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountFactor = BigDecimal.ONE.subtract(
                    this.product.getDiscountPercent().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP));
            return original.multiply(discountFactor).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return original;
    }

    public boolean hasSufficientStock(int quantity) {
        return this.stockQuantity != null && this.stockQuantity >= quantity;
    }

    public void decreaseStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng giảm kho phải lớn hơn 0.");
        }
        if (!hasSufficientStock(quantity)) {
            throw new IllegalStateException("Số lượng tồn kho không đủ. Hiện có: " + this.stockQuantity + ", yêu cầu: " + quantity);
        }
        this.stockQuantity -= quantity;
    }

    public void increaseStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng tăng kho phải lớn hơn 0.");
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        this.stockQuantity += quantity;
    }
}
