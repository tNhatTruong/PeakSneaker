package com.peaksneaker.controller;

import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.service.BrandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
public class BrandController {

    @Autowired
    private BrandService brandService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getAllBrands() {
        List<BrandResponse> brands = brandService.getAllActiveBrands();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thương hiệu thành công", brands));
    }
}
