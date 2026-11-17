package com.peaksneaker.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuarantineBatchRequest {
    @NotNull(message = "Trạng thái phong tỏa không được để trống")
    @JsonProperty("isQuarantined")
    @JsonAlias({"quarantine", "isQuarantined"})
    private Boolean isQuarantined;

    private String reason;
}

