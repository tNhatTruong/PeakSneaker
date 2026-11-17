package com.peaksneaker.entity;

import com.peaksneaker.enums.Gender;
import com.peaksneaker.enums.ProductType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silhouette_id")
    private Silhouette silhouette;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Gender gender = Gender.UNISEX;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 50)
    @Builder.Default
    private ProductType productType = ProductType.SNEAKER;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Image> images = new ArrayList<>();

    @Column(columnDefinition = "text")
    private String attributes;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @org.hibernate.annotations.Formula("(SELECT COALESCE(SUM(oi_sub.quantity), 0) FROM order_items oi_sub JOIN product_variants pv_sub ON oi_sub.product_variant_id = pv_sub.id JOIN orders o_sub ON oi_sub.order_id = o_sub.id WHERE pv_sub.product_id = id AND o_sub.status <> 'CANCELLED')")
    private Integer totalSold;

    @Transient
    private BigDecimal price;

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

    public void softDelete() {
        this.isDeleted = true;
    }

    public void restore() {
        this.isDeleted = false;
    }

    public boolean isAvailable() {
        return !this.isDeleted;
    }

    public BigDecimal getPrice() {
        if (this.price != null) {
            return this.price;
        }
        if (this.discountPercent != null && this.discountPercent.compareTo(BigDecimal.ZERO) > 0 && this.basePrice != null) {
            BigDecimal discountFactor = BigDecimal.ONE.subtract(
                    this.discountPercent.divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP));
            return this.basePrice.multiply(discountFactor).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        return this.basePrice;
    }
}
