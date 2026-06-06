package com.peaksneaker.controller;

import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.service.SilhouetteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/silhouettes")
@RequiredArgsConstructor
public class SilhouetteController {

    private final SilhouetteService silhouetteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SilhouetteResponse>>> getAllSilhouettes() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách dòng giày thành công", silhouetteService.getAllSilhouettes()));
    }

    @GetMapping("/brand/{brandId}")
    public ResponseEntity<ApiResponse<List<SilhouetteResponse>>> getSilhouettesByBrand(@PathVariable Long brandId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách dòng giày theo thương hiệu thành công", silhouetteService.getSilhouettesByBrandId(brandId)));
    }
}
