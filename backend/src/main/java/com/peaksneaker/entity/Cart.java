package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "carts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartItem> items = new java.util.ArrayList<>();


    // Thêm biến thể giày vào giỏ; nếu biến thể đã tồn tại thì tăng số lượng
    public void addItem(ProductVariant variant, int quantity) {
        if (variant == null) {
            throw new IllegalArgumentException("Biến thể giày không được null.");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng thêm phải lớn hơn 0.");
        }
        
        CartItem existingItem = findItemByVariant(variant);
        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(this)
                    .productVariant(variant)
                    .quantity(quantity)
                    .build();
            this.items.add(newItem);
        }
    }

    // Cập nhật số lượng của một dòng giày; tự động xóa khỏi giỏ nếu số lượng <= 0
    public void updateItemQuantity(ProductVariant variant, int quantity) {
        if (variant == null) {
            throw new IllegalArgumentException("Biến thể giày không được null.");
        }
        CartItem existingItem = findItemByVariant(variant);
        if (existingItem != null) {
            if (quantity <= 0) {
                this.items.remove(existingItem);
            } else {
                existingItem.setQuantity(quantity);
            }
        }
    }

    // Gỡ hoàn toàn một biến thể giày khỏi giỏ hàng
    public void removeItem(ProductVariant variant) {
        if (variant == null) return;
        CartItem existingItem = findItemByVariant(variant);
        if (existingItem != null) {
            this.items.remove(existingItem);
        }
    }

    // Xóa sạch toàn bộ sản phẩm trong giỏ hàng
    public void clear() {
        this.items.clear();
    }

    // Gộp giỏ hàng tạm của khách chưa đăng nhập vào giỏ hàng trên database sau khi đăng nhập
    public void merge(Cart guestCart) {
        if (guestCart == null || guestCart.getItems() == null) return;
        for (CartItem guestItem : guestCart.getItems()) {
            this.addItem(guestItem.getProductVariant(), guestItem.getQuantity());
        }
    }

    // Tổng số lượng tất cả giày có trong giỏ hàng
    public int getTotalQuantity() {
        if (this.items == null) return 0;
        return this.items.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    private CartItem findItemByVariant(ProductVariant variant) {
        if (this.items == null || variant == null || variant.getId() == null) return null;
        return this.items.stream()
                .filter(item -> item.getProductVariant() != null && variant.getId().equals(item.getProductVariant().getId()))
                .findFirst()
                .orElse(null);
    }
}

