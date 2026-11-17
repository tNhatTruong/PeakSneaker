package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
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
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

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

    public void removeItem(ProductVariant variant) {
        if (variant == null) return;
        CartItem existingItem = findItemByVariant(variant);
        if (existingItem != null) {
            this.items.remove(existingItem);
        }
    }

    public void clear() {
        this.items.clear();
    }

    public void merge(Cart guestCart) {
        if (guestCart == null || guestCart.getItems() == null) return;
        for (CartItem guestItem : guestCart.getItems()) {
            this.addItem(guestItem.getProductVariant(), guestItem.getQuantity());
        }
    }

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
