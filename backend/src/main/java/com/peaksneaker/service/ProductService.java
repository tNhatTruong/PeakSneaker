package com.peaksneaker.service;

import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.ProductResponse;
import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.Product;
import com.peaksneaker.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId,
            Long brandId,
            Long silhouetteId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        org.springframework.data.domain.Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? 
                org.springframework.data.domain.Sort.Direction.DESC : 
                org.springframework.data.domain.Sort.Direction.ASC;
                
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(direction, sortBy));

        org.springframework.data.jpa.domain.Specification<Product> spec = 
                com.peaksneaker.repository.specification.ProductSpecification.filterProducts(
                        categoryId, brandId, silhouetteId, minPrice, maxPrice, search);

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        Page<ProductResponse> productResponsePage = productPage.map(this::mapToResponse);

        return PaginatedResponse.from(productResponsePage);
    }

    public List<ProductResponse> getFeaturedProducts(int limit) {
        Page<Product> page = productRepository.findByIsFeaturedTrueAndIsDeletedFalse(PageRequest.of(0, limit));
        return page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ProductResponse> getNewArrivals(int limit) {
        Page<Product> page = productRepository.findByIsDeletedFalseOrderByCreatedAtDesc(PageRequest.of(0, limit));
        return page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ProductResponse mapToResponse(Product product) {
        String defaultImage = product.getImages().stream()
                .filter(Image::getIsPrimary)
                .map(Image::getImageUrl)
                .findFirst()
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl());

        BrandResponse brandResponse = null;
        if (product.getBrand() != null) {
            brandResponse = BrandResponse.builder()
                    .id(product.getBrand().getId())
                    .name(product.getBrand().getName())
                    .logoUrl(product.getBrand().getLogoUrl())
                    .build();
        }

        // Đánh dấu là sản phẩm mới nếu được tạo trong vòng 7 ngày qua
        boolean isNew = product.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS));

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(brandResponse)
                .basePrice(product.getBasePrice())
                .defaultImageUrl(defaultImage)
                .isFeatured(product.getIsFeatured())
                .isNew(isNew)
                .build();
    }
}
