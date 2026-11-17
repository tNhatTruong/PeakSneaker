package com.peaksneaker.dto.response;

import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.InventoryAuditLog;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.InventoryChangeType;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long variantId;
    private String variantSku;
    private String variantColor;
    private String variantSize;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private String brandName;
    private InventoryChangeType changeType;
    private Integer quantityChanged;
    private Integer balanceBefore;
    private Integer balanceAfter;
    private String reason;
    private String performedBy;
    private Instant createdAt;

    public static AuditLogResponse fromEntity(InventoryAuditLog log) {
        if (log == null) return null;
        ProductVariant variant = log.getVariant();
        Product product = variant != null ? variant.getProduct() : null;
        String imageUrl = product != null && product.getImages() != null
                ? product.getImages().stream()
                        .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                        .findFirst()
                        .or(() -> product.getImages().stream().findFirst())
                        .map(Image::getImageUrl)
                        .orElse(null)
                : null;
        int balanceAfter = log.getBalanceAfter() != null ? log.getBalanceAfter() : 0;
        int quantityChanged = log.getQuantityChanged() != null ? log.getQuantityChanged() : 0;
        return AuditLogResponse.builder()
                .id(log.getId())
                .variantId(variant != null ? variant.getId() : null)
                .variantSku(variant != null ? variant.getSku() : null)
                .variantColor(variant != null ? variant.getColor() : null)
                .variantSize(variant != null ? variant.getSize() : null)
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .productImageUrl(imageUrl)
                .brandName(product != null && product.getBrand() != null ? product.getBrand().getName() : null)
                .changeType(log.getChangeType())
                .quantityChanged(quantityChanged)
                .balanceBefore(Math.max(0, balanceAfter - quantityChanged))
                .balanceAfter(balanceAfter)
                .reason(log.getReason())
                .performedBy(log.getPerformedBy() != null && !log.getPerformedBy().isBlank()
                        ? log.getPerformedBy()
                        : "SYSTEM")
                .createdAt(log.getCreatedAt())
                .build();
    }
}
