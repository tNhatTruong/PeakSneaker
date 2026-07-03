package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long variantId;
    private String color;
    private String size;
    private String sku;
    private Integer quantity;
    private String type;
    private String note;
    private Instant createdAt;
}
