package com.peaksneaker.controller;

import com.peaksneaker.dto.request.SilhouetteRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.service.SilhouetteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/silhouettes")
@RequiredArgsConstructor
public class AdminSilhouetteController {

    private final SilhouetteService silhouetteService;

    @GetMapping("/brand/{brandId}")
    public ResponseEntity<ApiResponse<List<SilhouetteResponse>>> getSilhouettesByBrand(@PathVariable Long brandId) {
        List<SilhouetteResponse> silhouettes = silhouetteService.getSilhouettesByBrandId(brandId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách dòng giày thành công", silhouettes));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<SilhouetteResponse>> createSilhouette(@Valid @ModelAttribute SilhouetteRequest request) {
        SilhouetteResponse silhouette = silhouetteService.createSilhouette(request);
        return ResponseEntity.ok(ApiResponse.success("Thêm mới dòng giày thành công", silhouette));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<SilhouetteResponse>> updateSilhouette(
            @PathVariable Long id,
            @Valid @ModelAttribute SilhouetteRequest request) {
        SilhouetteResponse silhouette = silhouetteService.updateSilhouette(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật dòng giày thành công", silhouette));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSilhouette(@PathVariable Long id) {
        silhouetteService.deleteSilhouette(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa dòng giày thành công", null));
    }
}
