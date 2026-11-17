package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockItemResponse {
    private Long variantId;
    private Long productId;
    private String productName;
    private String imageUrl;
    private String sku;
    private String color;
    private String size;
    private Integer stock;
    private Integer safetyStockThreshold;
}
