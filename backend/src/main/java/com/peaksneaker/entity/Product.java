package com.peaksneaker.entity;

import com.peaksneaker.enums.Gender;
import com.peaksneaker.enums.ProductType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

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

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silhouette_id")
    private Silhouette silhouette;

    @Column(name = "is_featured", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "attribute", columnDefinition = "jsonb")
    private String attributes; // Stored as JSON string

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "price", nullable = false, precision = 12, scale = 2, columnDefinition = "numeric(12,2) default 0.00")
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(50)")
    private Gender gender; // MEN | WOMEN | UNISEX

    @Column(name = "product_type", nullable = false, columnDefinition = "varchar(50)")
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private ProductType productType = ProductType.SNEAKER; // SNEAKER | ACCESSORY

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ProductVariant> variants = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<Image> images = new java.util.ArrayList<>();

    // Xóa mềm: đánh dấu sản phẩm là đã xóa thay vì xóa cứng, tránh làm hỏng lịch sử
    // đơn hàng
    public void softDelete() {
        this.isDeleted = true;
    }

    // Khôi phục sản phẩm đã bị xóa mềm trở lại trạng thái bán bình thường
    public void restore() {
        this.isDeleted = false;
    }

    // Trả về true nếu sản phẩm chưa bị xóa mềm và có thể hiển thị trên gian hàng
    public boolean isAvailable() {
        return !this.isDeleted;
    }
}
