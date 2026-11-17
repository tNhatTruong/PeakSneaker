package com.peaksneaker.dto.response;

import com.peaksneaker.entity.Wishlist;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private BigDecimal basePrice;
    private String brandName;
    private String primaryImageUrl;
    private Instant createdAt;

    public static WishlistResponse fromEntity(Wishlist entity, String primaryImageUrl) {
        if (entity == null) return null;
        return WishlistResponse.builder()
                .id(entity.getId())
                .productId(entity.getProduct() != null ? entity.getProduct().getId() : null)
                .productName(entity.getProduct() != null ? entity.getProduct().getName() : null)
                .productSlug(entity.getProduct() != null ? entity.getProduct().getSlug() : null)
                .basePrice(entity.getProduct() != null ? entity.getProduct().getBasePrice() : null)
                .brandName(entity.getProduct() != null && entity.getProduct().getBrand() != null 
                        ? entity.getProduct().getBrand().getName() : null)
                .primaryImageUrl(primaryImageUrl)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
