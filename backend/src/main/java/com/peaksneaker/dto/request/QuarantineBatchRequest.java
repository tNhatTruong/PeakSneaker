package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuarantineBatchRequest {
    @NotNull(message = "Trạng thái phong tỏa không được để trống")
    private Boolean isQuarantined;

    private String reason;
}

