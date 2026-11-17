package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductFilterOptionResponse {
    private Long brandId;
    private Long categoryId;
    private Long silhouetteId;
}
