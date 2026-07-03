package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SilhouetteRequest {

    @NotBlank(message = "Tên dòng giày không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Brand ID không được để trống")
    private Long brandId;

    private MultipartFile image;
}
