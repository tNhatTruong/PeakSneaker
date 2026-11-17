package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryVariantSummaryResponse {
    private long total;
    private long inStock;
    private long lowStock;
    private long outOfStock;
    private long inactive;
}
