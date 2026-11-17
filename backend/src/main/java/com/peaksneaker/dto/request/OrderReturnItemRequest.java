package com.peaksneaker.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReturnItemRequest {

    @NotNull(message = "Mặt hàng đổi trả không được để trống")
    private Long orderItemId;

    @NotNull(message = "Số lượng đổi trả không được để trống")
    @Min(value = 1, message = "Số lượng đổi trả phải lớn hơn 0")
    private Integer quantity;
}
