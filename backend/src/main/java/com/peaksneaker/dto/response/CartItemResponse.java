// File: backend/src/main/java/com/peaksneaker/dto/response/CartItemResponse.java
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
public class CartItemResponse {
    private Long id;
    private Long variantId;
    private String sku;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
    private Long productId;
    private String productName;
    private String productThumbnail;
    private Integer stockQuantity;
}
