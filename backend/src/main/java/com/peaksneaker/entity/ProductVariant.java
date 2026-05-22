package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "product_variants")
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

    @Column(length = 100)
    private String color;

    @Column(length = 50)
    private String size;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(columnDefinition = "jsonb")
    private String attributes; // Stored as JSON string

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

    // Tính giá bán thực tế của biến thể: giá gốc sản phẩm + mức chênh lệch theo màu/size
    public BigDecimal getFinalPrice() {
        if (this.product == null) {
            throw new IllegalStateException("Biến thể chưa được liên kết với sản phẩm.");
        }
        BigDecimal base = this.product.getBasePrice();
        if (base == null) {
            return BigDecimal.ZERO;
        }
        return base.add(this.priceAdjustment != null ? this.priceAdjustment : BigDecimal.ZERO);
    }

    // Kiểm tra xem tồn kho còn đủ số lượng yêu cầu hay không
    public boolean hasSufficientStock(int quantity) {
        return this.stockQuantity != null && this.stockQuantity >= quantity;
    }

    // Trừ tồn kho khi đơn hàng được xác nhận, ném ngoại lệ nếu không đủ hàng
    public void decreaseStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng giảm kho phải lớn hơn 0.");
        }
        if (!hasSufficientStock(quantity)) {
            throw new IllegalStateException("Số lượng tồn kho không đủ. Hiện có: " + this.stockQuantity + ", yêu cầu: " + quantity);
        }
        this.stockQuantity -= quantity;
    }

    // Cộng lại tồn kho khi nhập hàng mới hoặc khi đơn hàng bị hủy
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

