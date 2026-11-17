package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BrandVisibilityRequest {

    @NotNull(message = "Trạng thái hiển thị không được để trống")
    private Boolean isActive;
}
