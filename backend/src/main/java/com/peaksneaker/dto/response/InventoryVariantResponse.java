package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryVariantResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Long brandId;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private Long silhouetteId;
    private String silhouetteName;
    private String sku;
    private String color;
    private String size;
    private Integer stock;
    private Integer safetyStockThreshold;
    private BigDecimal priceAdjustment;
    private BigDecimal finalPrice;
    private Boolean productInactive;
    private Instant createdAt;
}
