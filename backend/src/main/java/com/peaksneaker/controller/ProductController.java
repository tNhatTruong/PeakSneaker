package com.peaksneaker.controller;

import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.ProductResponse;
import com.peaksneaker.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts(
            @RequestParam(defaultValue = "8") int limit) {
        List<ProductResponse> products = productService.getFeaturedProducts(limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm nổi bật thành công", products));
    }

    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewArrivals(
            @RequestParam(defaultValue = "8") int limit) {
        List<ProductResponse> products = productService.getNewArrivals(limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm mới thành công", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.ProductDetailResponse>> getProductById(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        com.peaksneaker.dto.response.ProductDetailResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết sản phẩm thành công", product));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.PaginatedResponse<ProductResponse>>> filterProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long silhouetteId,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        com.peaksneaker.dto.response.PaginatedResponse<ProductResponse> response = productService.filterProducts(
                categoryId, brandId, silhouetteId, minPrice, maxPrice, search, page, size, sortBy, sortDirection);
        return ResponseEntity.ok(ApiResponse.success("Lọc sản phẩm thành công", response));
    }
}
