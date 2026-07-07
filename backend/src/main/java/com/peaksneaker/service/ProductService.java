package com.peaksneaker.service;

import com.peaksneaker.dto.request.CreateProductRequest;
import com.peaksneaker.dto.request.UpdateProductRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.entity.*;
import com.peaksneaker.enums.Gender;
import com.peaksneaker.enums.ProductType;
import com.peaksneaker.repository.CategoryRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.SilhouetteRepository;
import com.peaksneaker.repository.specification.ProductSpecification;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final SilhouetteRepository silhouetteRepository;
    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    // ─── Public queries ───────────────────────────────────────────────────────

    public PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection) {

        Sort.Direction dir = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Specification<Product> spec = ProductSpecification.filterProducts(
                categoryId, brandId, silhouetteId, minPrice, maxPrice, search);
        return PaginatedResponse.from(productRepository.findAll(spec, pageable).map(this::mapToResponse));
    }

    /** Admin: tra ve tat ca san pham (ke ca da xoa mem). */
    public PaginatedResponse<ProductResponse> filterProductsAdmin(
            String search, int page, int size, String sortBy, String sortDirection) {

        Sort.Direction dir = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Specification<Product> spec = ProductSpecification.filterProductsAdmin(search);
        return PaginatedResponse.from(productRepository.findAll(spec, pageable).map(this::mapToResponse));
    }

    public List<ProductResponse> getFeaturedProducts(int limit) {
        return productRepository.findByIsFeaturedTrueAndIsDeletedFalse(PageRequest.of(0, limit))
                .getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ProductResponse> getNewArrivals(int limit) {
        return productRepository.findByIsDeletedFalseOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay san pham: " + id));
        return mapToDetailResponse(product);
    }

    @Transactional
    public ProductDetailResponse createProduct(CreateProductRequest request, List<MultipartFile> images) {
        Silhouette silhouette = silhouetteRepository.findById(request.getSilhouetteId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay dong SP: " + request.getSilhouetteId()));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay danh muc: " + request.getCategoryId()));
        }

        BigDecimal discount = request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal price = request.getBasePrice().subtract(
                request.getBasePrice().multiply(discount).divide(BigDecimal.valueOf(100)));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .discountPercent(discount)
                .price(price)
                .silhouette(silhouette)
                .category(category)
                .gender(request.getGender() != null ? request.getGender() : Gender.UNISEX)
                .productType(request.getProductType() != null ? request.getProductType() : ProductType.SNEAKER)
                .isFeatured(Boolean.TRUE.equals(request.getIsFeatured()))
                .images(new ArrayList<>())
                .variants(new ArrayList<>())
                .build();

        Product saved = productRepository.save(product);
        saved = attachImages(saved, images, true);
        return mapToDetailResponse(saved);
    }

    @Transactional
    public ProductDetailResponse updateProduct(Long id, UpdateProductRequest request, List<MultipartFile> newImages) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay san pham: " + id));

        if (request.getName() != null && !request.getName().isBlank()) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getIsFeatured() != null) product.setIsFeatured(request.getIsFeatured());
        if (request.getGender() != null) product.setGender(request.getGender());
        if (request.getProductType() != null) product.setProductType(request.getProductType());

        if (request.getSilhouetteId() != null) {
            product.setSilhouette(silhouetteRepository.findById(request.getSilhouetteId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay dong SP: " + request.getSilhouetteId())));
        }
        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay danh muc: " + request.getCategoryId())));
        }

        BigDecimal base = request.getBasePrice() != null ? request.getBasePrice() : product.getBasePrice();
        BigDecimal disc = request.getDiscountPercent() != null ? request.getDiscountPercent()
                : (product.getDiscountPercent() != null ? product.getDiscountPercent() : BigDecimal.ZERO);
        if (request.getBasePrice() != null || request.getDiscountPercent() != null) {
            product.setBasePrice(base);
            product.setDiscountPercent(disc);
            product.setPrice(base.subtract(base.multiply(disc).divide(BigDecimal.valueOf(100))));
        }

        product = attachImages(product, newImages, false);
        return mapToDetailResponse(productRepository.save(product));
    }

    @Transactional
    public void softDeleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay san pham: " + id));
        product.softDelete();
        productRepository.save(product);
    }

    private Product attachImages(Product product, List<MultipartFile> files, boolean firstIsPrimary) {
        if (files == null || files.isEmpty()) return product;
        boolean makePrimary = firstIsPrimary && product.getImages().isEmpty();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            try {
                String imageName = cloudinaryService.upload(file);
                product.getImages().add(Image.builder()
                        .product(product).imageName(imageName).isPrimary(makePrimary).build());
                makePrimary = false;
            } catch (Exception e) {
                throw new RuntimeException("Loi khi upload anh: " + e.getMessage());
            }
        }
        return productRepository.save(product);
    }


    private ProductResponse mapToResponse(Product product) {
        String defaultImageName = product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(Image::getImageName).findFirst()
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageName());

        String imageUrl = null;
        if (defaultImageName != null) {
            try { imageUrl = cloudinaryService.creteImageUrl(defaultImageName); } catch (Exception ignored) {}
        }

        BrandResponse brandResponse = null;
        if (product.getSilhouette() != null && product.getSilhouette().getBrand() != null) {
            Brand brand = product.getSilhouette().getBrand();
            brandResponse = BrandResponse.builder()
                    .id(brand.getId()).name(brand.getName())
                    .logoUrl(brand.getLogoUrl()).description(brand.getDescription()).build();
        }

        int totalStock = product.getVariants().stream()
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0).sum();

        boolean isNew = product.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS));

        return ProductResponse.builder()
                .id(product.getId()).name(product.getName()).brand(brandResponse)
                .basePrice(product.getBasePrice()).discountPercent(product.getDiscountPercent())
                .price(product.getPrice()).defaultImageUrl(imageUrl)
                .isFeatured(product.getIsFeatured()).isNew(isNew)
                .isDeleted(product.getIsDeleted()).totalStock(totalStock).build();
    }

    private ProductDetailResponse mapToDetailResponse(Product product) {
        BrandResponse brandResponse = null;
        if (product.getSilhouette() != null && product.getSilhouette().getBrand() != null) {
            Brand brand = product.getSilhouette().getBrand();
            brandResponse = BrandResponse.builder()
                    .id(brand.getId()).name(brand.getName())
                    .logoUrl(brand.getLogoUrl()).description(brand.getDescription()).build();
        }

        CategoryResponse categoryResponse = null;
        if (product.getCategory() != null) {
            categoryResponse = CategoryResponse.builder()
                    .id(product.getCategory().getId()).name(product.getCategory().getName()).build();
        }

        SilhouetteResponse silhouetteResponse = null;
        if (product.getSilhouette() != null) {
            silhouetteResponse = SilhouetteResponse.builder()
                    .id(product.getSilhouette().getId()).name(product.getSilhouette().getName()).build();
        }

        List<ImageResponse> imageResponses = product.getImages().stream()
                .map(img -> ImageResponse.builder().id(img.getId())
                        .imageUrl(cloudinaryService.creteImageUrl(img.getImageName()))
                        .isPrimary(img.getIsPrimary()).build())
                .collect(Collectors.toList());

        List<ProductVariantResponse> variantResponses = product.getVariants().stream()
                .map(v -> ProductVariantResponse.builder().id(v.getId())
                        .sku(v.getSku()).color(v.getColor()).size(v.getSize()).stock(v.getStockQuantity())
                        .priceMultiplier(v.getPriceAdjustment()).finalPrice(v.getFinalPrice()).build())
                .collect(Collectors.toList());

        boolean isNew = product.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS));

        return ProductDetailResponse.builder()
                .id(product.getId()).name(product.getName()).description(product.getDescription())
                .basePrice(product.getBasePrice()).discountPercent(product.getDiscountPercent())
                .price(product.getPrice()).brand(brandResponse).category(categoryResponse)
                .silhouette(silhouetteResponse)
                .gender(product.getGender() != null ? product.getGender().name() : null)
                .productType(product.getProductType() != null ? product.getProductType().name() : null)
                .attributes(product.getAttributes())
                .isFeatured(product.getIsFeatured()).isNew(isNew).isDeleted(product.getIsDeleted())
                .images(imageResponses).variants(variantResponses).build();
    }
}