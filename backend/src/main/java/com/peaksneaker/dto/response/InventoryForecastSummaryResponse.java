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
public class InventoryForecastSummaryResponse {
    private long totalVariants;
    private long criticalCount;
    private long warningCount;
    private long fastMovingCount;
    private long slowMovingCount;
    private long healthyCount;
    private long totalSuggestedUnits;
    private BigDecimal totalEstimatedRestockCost;
}

