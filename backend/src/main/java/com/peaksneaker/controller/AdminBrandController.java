package com.peaksneaker.controller;

import com.peaksneaker.dto.request.BrandRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.service.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/brands")
@RequiredArgsConstructor
public class AdminBrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandResponse>>> searchBrands(
            @RequestParam(required = false) String keyword) {
        List<BrandResponse> brands = brandService.searchBrands(keyword);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thương hiệu thành công", brands));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<BrandResponse>> createBrand(@Valid @ModelAttribute BrandRequest request) {
        BrandResponse brand = brandService.createBrand(request);
        return ResponseEntity.ok(ApiResponse.success("Thêm mới thương hiệu thành công", brand));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<BrandResponse>> updateBrand(
            @PathVariable Long id,
            @Valid @ModelAttribute BrandRequest request) {
        BrandResponse brand = brandService.updateBrand(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thương hiệu thành công", brand));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thương hiệu thành công", null));
    }
}
