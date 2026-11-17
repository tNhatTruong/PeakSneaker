package com.peaksneaker.dto.request;

import com.peaksneaker.enums.ReturnType;
import com.peaksneaker.enums.ReturnReasonCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReturnRequest {
    @NotNull(message = "Mã đơn hàng không được để trống")
    private Long orderId;

    @NotNull(message = "Loại yêu cầu không được để trống")
    private ReturnType returnType;

    @NotNull(message = "Lý do đổi trả không được để trống")
    private ReturnReasonCode reasonCode;

    @NotBlank(message = "Lý do đổi trả không được để trống")
    private String reason;

    private List<String> evidenceImages;

    @Valid
    @NotEmpty(message = "Vui lòng chọn ít nhất một sản phẩm cần đổi trả")
    private List<OrderReturnItemRequest> items;
}
