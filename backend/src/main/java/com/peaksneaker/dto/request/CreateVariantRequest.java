package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateVariantRequest {

    @NotBlank(message = "Màu sắc không được để trống")
    private String color;

    @NotBlank(message = "Kích cỡ không được để trống")
    private String size;

    @NotBlank(message = "Mã SKU không được để trống")
    private String sku;

    private BigDecimal priceAdjustment;
}
