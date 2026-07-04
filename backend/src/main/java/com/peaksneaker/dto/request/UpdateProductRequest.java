package com.peaksneaker.dto.request;

import com.peaksneaker.enums.Gender;
import com.peaksneaker.enums.ProductType;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
@Data
public class UpdateProductRequest {

    private String name;

    private String description;

    @DecimalMin(value = "0", inclusive = false, message = "Gia san pham phai lon hon 0")
    private BigDecimal basePrice;

    private BigDecimal discountPercent;

    private Long silhouetteId;

    private Long categoryId;

    private Gender gender;

    private ProductType productType;

    private Boolean isFeatured;
}
