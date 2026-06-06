package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BrandResponse brand;
    private CategoryResponse category;
    private SilhouetteResponse silhouette;
    private Boolean isFeatured;
    private Boolean isNew;
    private List<ImageResponse> images;
    private List<ProductVariantResponse> variants;
}
