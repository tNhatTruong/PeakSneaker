package com.peaksneaker.controller;

import com.peaksneaker.dto.request.CreateProductRequest;
import com.peaksneaker.dto.request.UpdateProductRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.AdminProductFilterOptionResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.ProductDetailResponse;
import com.peaksneaker.dto.response.ProductResponse;
import com.peaksneaker.enums.AdminProductStatus;
import com.peaksneaker.enums.AdminProductStockStatus;
import com.peaksneaker.enums.Gender;
import com.peaksneaker.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.success("OK", productService.getFeaturedProducts(limit)));
    }

    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewArrivals(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.success("OK", productService.getNewArrivals(limit)));
    }

    @GetMapping("/sale")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getSaleProducts(
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(ApiResponse.success("OK", productService.getSaleProducts(limit)));
    }

    @GetMapping("/available-sizes")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableSizes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long silhouetteId) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                productService.getAvailableSizes(categoryId, brandId, silhouetteId)));
    }

    @GetMapping("/filter-options")
    public ResponseEntity<ApiResponse<List<AdminProductFilterOptionResponse>>> getFilterOptions() {
        return ResponseEntity.ok(ApiResponse.success("OK", productService.getFilterOptions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("OK", productService.getProductById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductResponse>>> filterProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long silhouetteId,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(required = false) String variantSize,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                productService.filterProducts(categoryId, brandId, silhouetteId, gender, onSale, variantSize, minPrice, maxPrice, search, page, size, sortBy, sortDirection)));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductResponse>>> getAdminProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AdminProductStatus status,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long silhouetteId,
            @RequestParam(required = false) AdminProductStockStatus stockStatus,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        return ResponseEntity.ok(ApiResponse.success("OK",
                productService.filterProductsAdmin(
                        search, status, brandId, categoryId, silhouetteId, stockStatus,
                        minPrice, maxPrice, page, size, sortBy, sortDirection)));
    }

    @PostMapping(value = "/admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProductDetailResponse>> createProduct(
            @Valid @RequestPart("data") CreateProductRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return ResponseEntity.ok(ApiResponse.success("Thêm sản phẩm thành công", productService.createProduct(request, images)));
    }

    @PutMapping(value = "/admin/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProductDetailResponse>> updateProduct(
            @PathVariable Long id,
            @RequestPart("data") UpdateProductRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công", productService.updateProduct(id, request, images)));
    }

    @PatchMapping("/admin/{id}/visibility")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> updateProductVisibility(
            @PathVariable Long id,
            @RequestParam boolean isVisible) {
        return ResponseEntity.ok(ApiResponse.success(
                isVisible ? "Đã hiển thị sản phẩm" : "Đã ẩn sản phẩm",
                productService.updateProductVisibility(id, isVisible)));
    }

    @PatchMapping("/admin/{id}/discount")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> updateProductDiscount(
            @PathVariable Long id,
            @RequestParam BigDecimal discountPercent) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật giảm giá sản phẩm thành công",
                productService.updateProductDiscount(id, discountPercent)));
    }

    @GetMapping("/admin/filter-options")
    public ResponseEntity<ApiResponse<List<AdminProductFilterOptionResponse>>> getAdminFilterOptions() {
        return ResponseEntity.ok(ApiResponse.success("OK", productService.getAdminFilterOptions()));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<Void>> softDeleteProduct(@PathVariable Long id) {
        productService.softDeleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm thành công", null));
    }
}
