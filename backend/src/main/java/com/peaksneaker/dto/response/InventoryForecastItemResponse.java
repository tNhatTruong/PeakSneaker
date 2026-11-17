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
public class InventoryForecastItemResponse {
    private Long variantId;
    private String sku;
    private String color;
    private String size;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Long brandId;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private int stock;
    private int safetyStockThreshold;
    private int soldInPeriod;
    private double dailyVelocity;
    private Integer daysUntilStockout;
    private int reorderPoint;
    private int suggestedReorderQty;
    private BigDecimal retailPrice;
    private BigDecimal latestUnitCost;
    private BigDecimal estimatedRestockCost;
    private String latestSupplierName;
    private String forecastStatus;
}

