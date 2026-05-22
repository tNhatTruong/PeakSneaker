package com.peaksneaker.entity;

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

    @Column(nullable = false, unique = true)
    private String slug;

    private String brand;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(length = 50)
    private String gender; // MEN | WOMEN | UNISEX

    @Column(name = "product_type", nullable = false, length = 50)
    @Builder.Default
    private String productType = "SNEAKER"; // SNEAKER | ACCESSORY

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

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

    // Xóa mềm: đánh dấu sản phẩm là đã xóa thay vì xóa cứng, tránh làm hỏng lịch sử đơn hàng
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

