package com.peaksneaker.service;

import com.peaksneaker.dto.response.*;
import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.Product;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.specification.ProductSpecification;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

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
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
                
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Specification<Product> spec = ProductSpecification.filterProducts(categoryId, brandId, silhouetteId, minPrice, maxPrice, search);

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

    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm có ID: " + id));
        
        if (product.getIsDeleted() != null && product.getIsDeleted()) {
            throw new IllegalArgumentException("Sản phẩm đã bị xóa.");
        }

        return mapToDetailResponse(product);
    }

    private ProductResponse mapToResponse(Product product) {
        String defaultImage = product.getImages().stream()
                .filter(Image::getIsPrimary)
                .map(Image::getImageName)
                .findFirst()
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageName());

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
                .defaultImageUrl(cloudinaryService.creteImageUrl(defaultImage))
                .isFeatured(product.getIsFeatured())
                .isNew(isNew)
                .build();
    }

    private ProductDetailResponse mapToDetailResponse(Product product) {
        BrandResponse brandResponse = null;
        if (product.getBrand() != null) {
            brandResponse = BrandResponse.builder()
                    .id(product.getBrand().getId())
                    .name(product.getBrand().getName())
                    .logoUrl(product.getBrand().getLogoUrl())
                    .build();
        }

        CategoryResponse categoryResponse = null;
        if (product.getCategory() != null) {
            categoryResponse = CategoryResponse.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .build();
        }

        SilhouetteResponse silhouetteResponse = null;
        if (product.getSilhouette() != null) {
            silhouetteResponse = SilhouetteResponse.builder()
                    .id(product.getSilhouette().getId())
                    .name(product.getSilhouette().getName())
                    .build();
        }

        List<ImageResponse> imageResponses = product.getImages().stream()
                .map(img -> ImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(cloudinaryService.creteImageUrl(img.getImageName()))
                        .isPrimary(img.getIsPrimary())
                        .build())
                .collect(Collectors.toList());

        List<ProductVariantResponse> variantResponses = product.getVariants().stream()
                .map(variant -> ProductVariantResponse.builder()
                        .id(variant.getId())
                        .color(variant.getColor())
                        .size(variant.getSize())
                        .stock(variant.getStockQuantity())
                        .priceMultiplier(variant.getPriceAdjustment())
                        .finalPrice(variant.getFinalPrice())
                        .build())
                .collect(Collectors.toList());

        boolean isNew = product.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS));

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .brand(brandResponse)
                .category(categoryResponse)
                .silhouette(silhouetteResponse)
                .isFeatured(product.getIsFeatured())
                .isNew(isNew)
                .images(imageResponses)
                .variants(variantResponses)
                .build();
    }
}
