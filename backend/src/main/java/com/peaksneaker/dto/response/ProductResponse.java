package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private BrandResponse brand;
    private BigDecimal basePrice;
    private BigDecimal discountPercent;
    private BigDecimal price;         // Giá sau khi áp dụng discount
    private String defaultImageUrl;
    private Boolean isFeatured;
    private Boolean isNew;            // Tự tính toán dựa trên ngày tạo
    private Boolean isDeleted;
    private Integer totalStock;       // Tổng stockQuantity của tất cả variants
}
