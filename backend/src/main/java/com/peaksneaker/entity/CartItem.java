package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "cart_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "cart_id", "product_variant_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;


    // Tính tổng tiền của dòng sản phẩm này trong giỏ: giá biến thể * số lượng
    public java.math.BigDecimal getSubtotal() {
        if (this.productVariant == null) {
            return java.math.BigDecimal.ZERO;
        }
        java.math.BigDecimal finalPrice = this.productVariant.getFinalPrice();
        if (finalPrice == null) {
            return java.math.BigDecimal.ZERO;
        }
        return finalPrice.multiply(java.math.BigDecimal.valueOf(this.quantity));
    }
}

