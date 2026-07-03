package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class BrandRequest {

    @NotBlank(message = "Tên thương hiệu không được để trống")
    private String name;

    private String description;

    private MultipartFile logoImage;
}
