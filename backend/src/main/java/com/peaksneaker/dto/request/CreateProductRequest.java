package com.peaksneaker.dto.request;

import com.peaksneaker.enums.Gender;
import com.peaksneaker.enums.ProductType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO nhan du lieu tao san pham moi tu client.
 */
@Data
public class CreateProductRequest {

    @NotBlank(message = "Ten san pham khong duoc de trong")
    private String name;

    private String description;

    @NotNull(message = "Gia san pham khong duoc de trong")
    @DecimalMin(value = "0", inclusive = false, message = "Gia san pham phai lon hon 0")
    private BigDecimal basePrice;

    private BigDecimal discountPercent;

    @NotNull(message = "Dong san pham khong duoc de trong")
    private Long silhouetteId;

    private Long categoryId;

    private Gender gender;

    private ProductType productType;

    private Boolean isFeatured;
}
