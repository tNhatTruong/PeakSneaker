package com.peaksneaker.dto.request;

import com.peaksneaker.enums.ReturnStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReturnStatusRequest {
    @NotNull(message = "Trạng thái mới không được để trống")
    private ReturnStatus status;

    private BigDecimal refundAmount;
    private String adminNotes;
    private List<UpdateReturnItemRequest> items;
}
