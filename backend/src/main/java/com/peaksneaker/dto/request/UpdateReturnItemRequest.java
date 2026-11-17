package com.peaksneaker.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReturnItemRequest {

    @NotNull(message = "Chi tiết mặt hàng RMA không được để trống")
    private Long returnItemId;

    @Min(value = 0, message = "Số lượng duyệt không được âm")
    private Integer approvedQuantity;

    @Min(value = 0, message = "Số lượng nhận không được âm")
    private Integer receivedQuantity;

    @Min(value = 0, message = "Số lượng hoàn kho không được âm")
    private Integer restockableQuantity;

    private Long replacementVariantId;
    private String conditionNote;
}
