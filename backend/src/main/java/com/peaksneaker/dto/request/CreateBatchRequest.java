package com.peaksneaker.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBatchRequest {
    @NotNull(message = "ID biến thể không được để trống")
    private Long variantId;

    @NotBlank(message = "Mã lô hàng không được để trống")
    private String batchCode;

    @NotBlank(message = "Nhà cung cấp không được để trống")
    private String supplierName;

    @NotNull(message = "Số lượng nhập không được để trống")
    @Min(value = 1, message = "Số lượng nhập phải lớn hơn 0")
    private Integer quantityImported;

    @NotNull(message = "Đơn giá nhập không được để trống")
    @Min(value = 0, message = "Đơn giá nhập không được âm")
    private BigDecimal unitCost;

    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String poNumber;
    private String invoiceNumber;
    private String paymentStatus;
}
