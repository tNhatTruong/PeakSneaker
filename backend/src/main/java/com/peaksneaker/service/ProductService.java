package com.peaksneaker.service;

import com.peaksneaker.dto.request.CreateProductRequest;
import com.peaksneaker.dto.request.UpdateProductRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.AdminProductFilterOptionResponse;
import com.peaksneaker.dto.response.ProductDetailResponse;
import com.peaksneaker.dto.response.ProductResponse;
import com.peaksneaker.enums.AdminProductStatus;
import com.peaksneaker.enums.AdminProductStockStatus;
import com.peaksneaker.enums.Gender;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection);

    PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            Gender gender,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection);

    PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            Gender gender,
            Boolean onSale,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection);

    List<String> getAvailableSizes(Long categoryId, Long brandId, Long silhouetteId);

    List<AdminProductFilterOptionResponse> getFilterOptions();

    List<AdminProductFilterOptionResponse> getAdminFilterOptions();

    PaginatedResponse<ProductResponse> filterProductsAdmin(
            String search, AdminProductStatus status,
            Long brandId, Long categoryId, Long silhouetteId,
            AdminProductStockStatus stockStatus,
            BigDecimal minPrice, BigDecimal maxPrice,
            int page, int size, String sortBy, String sortDirection);

    List<ProductResponse> getFeaturedProducts(int limit);
    List<ProductResponse> getNewArrivals(int limit);
    List<ProductResponse> getSaleProducts(int limit);
    ProductDetailResponse getProductById(Long id);
    ProductDetailResponse createProduct(CreateProductRequest request, List<MultipartFile> images);
    ProductDetailResponse updateProduct(Long id, UpdateProductRequest request, List<MultipartFile> newImages);
    void softDeleteProduct(Long id);
    ProductDetailResponse updateProductVisibility(Long id, boolean isVisible);
    ProductDetailResponse updateProductDiscount(Long id, BigDecimal discountPercent);
}
