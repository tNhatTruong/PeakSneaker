package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.CreateProductRequest;
import com.peaksneaker.dto.request.UpdateProductRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.entity.*;
import com.peaksneaker.enums.Gender;
import com.peaksneaker.enums.ProductType;
import com.peaksneaker.enums.AdminProductStatus;
import com.peaksneaker.enums.AdminProductStockStatus;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.CategoryRepository;
import com.peaksneaker.repository.OrderItemRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.SilhouetteRepository;
import com.peaksneaker.repository.specification.ProductSpecification;
import com.peaksneaker.service.ProductService;
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
import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final SilhouetteRepository silhouetteRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final CloudinaryService cloudinaryService;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection) {
        return filterProducts(categoryId, brandId, silhouetteId, null, null, variantSize, minPrice, maxPrice, search, page, size, sortBy, sortDirection);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            Gender gender,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection) {
        return filterProducts(categoryId, brandId, silhouetteId, gender, null, variantSize, minPrice, maxPrice, search, page, size, sortBy, sortDirection);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            Gender gender,
            Boolean onSale,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection) {
        return filterProducts(categoryId, brandId, silhouetteId, gender, onSale, null, variantSize, minPrice, maxPrice, search, page, size, sortBy, sortDirection);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponse> filterProducts(
            Long categoryId, Long brandId, Long silhouetteId,
            Gender gender,
            Boolean onSale,
            Boolean inStockOnly,
            String variantSize,
            BigDecimal minPrice, BigDecimal maxPrice,
            String search, int page, int size, String sortBy, String sortDirection) {

        Sort sort = buildSort(sortBy, sortDirection);
        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<Product> spec = ProductSpecification.filterProducts(
                categoryId, brandId, silhouetteId, gender, onSale, inStockOnly, variantSize, minPrice, maxPrice, search);
        return PaginatedResponse.from(productRepository.findAll(spec, pageable).map(this::mapToResponse));
    }

    @Override
    public List<String> getAvailableSizes(Long categoryId, Long brandId, Long silhouetteId) {
        return productVariantRepository.findAvailableSizes(categoryId, brandId, silhouetteId);
    }

    @Override
    public List<AdminProductFilterOptionResponse> getFilterOptions() {
        return productRepository.findActiveFilterOptions();
    }

    @Override
    public List<AdminProductFilterOptionResponse> getAdminFilterOptions() {
        return productRepository.findAdminFilterOptions();
    }

    @Override
    public PaginatedResponse<ProductResponse> filterProductsAdmin(
            String search, AdminProductStatus status,
            Long brandId, Long categoryId, Long silhouetteId,
            AdminProductStockStatus stockStatus,
            BigDecimal minPrice, BigDecimal maxPrice,
            int page, int size, String sortBy, String sortDirection) {

        if (minPrice != null && minPrice.signum() < 0) {
            throw new BadRequestException("Giá tối thiểu không được nhỏ hơn 0");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new BadRequestException("Giá tối đa không được nhỏ hơn 0");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("Giá tối thiểu không được lớn hơn giá tối đa");
        }

        Sort sort = buildSort(sortBy, sortDirection);
        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<Product> spec = ProductSpecification.filterProductsAdmin(
                search, status, brandId, categoryId, silhouetteId, stockStatus, minPrice, maxPrice);
        return PaginatedResponse.from(productRepository.findAll(spec, pageable).map(this::mapToResponse));
    }

    @Override
    public List<ProductResponse> getFeaturedProducts(int limit) {
        int fetchSize = Math.max(limit * 2, 16);
        Sort sort = Sort.by(Sort.Order.desc("totalSold"), Sort.Order.asc("id"));
        return productRepository.findByIsFeaturedTrueAndIsDeletedFalse(PageRequest.of(0, fetchSize, sort))
                .getContent().stream()
                .map(this::mapToResponse)
                .sorted(java.util.Comparator
                        .<ProductResponse, Boolean>comparing(p -> (p.getTotalStock() != null ? p.getTotalStock() : 0) <= 0)
                        .thenComparing(p -> p.getTotalSold() != null ? p.getTotalSold() : 0, java.util.Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getNewArrivals(int limit) {
        return productRepository.findByIsDeletedFalseOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getSaleProducts(int limit) {
        return productRepository.findSaleProducts(PageRequest.of(0, limit))
                .getContent().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));
        return mapToDetailResponse(product);
    }

    @Override
    @Transactional
    public ProductDetailResponse createProduct(CreateProductRequest request, List<MultipartFile> images) {
        Silhouette silhouette = silhouetteRepository.findById(request.getSilhouetteId())
                .orElseThrow(() -> new ResourceNotFoundException("Dòng sản phẩm", "id", request.getSilhouetteId()));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", request.getCategoryId()));
        }

        BigDecimal discount = request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal price = request.getBasePrice().subtract(
                request.getBasePrice().multiply(discount).divide(BigDecimal.valueOf(100)));

        String slug = toSlug(request.getName()) + "-" + System.currentTimeMillis() % 10000;

        Product product = Product.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .attributes(request.getAttributes())
                .basePrice(request.getBasePrice())
                .discountPercent(discount)
                .price(price)
                .silhouette(silhouette)
                .brand(silhouette.getBrand())
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

    @Override
    @Transactional
    public ProductDetailResponse updateProduct(Long id, UpdateProductRequest request, List<MultipartFile> newImages) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            product.setName(request.getName());
            product.setSlug(toSlug(request.getName()) + "-" + id);
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getAttributes() != null) product.setAttributes(request.getAttributes());
        if (request.getIsFeatured() != null) product.setIsFeatured(request.getIsFeatured());
        if (request.getGender() != null) product.setGender(request.getGender());
        if (request.getProductType() != null) product.setProductType(request.getProductType());

        if (request.getSilhouetteId() != null) {
            Silhouette silhouette = silhouetteRepository.findById(request.getSilhouetteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dòng sản phẩm", "id", request.getSilhouetteId()));
            product.setSilhouette(silhouette);
            product.setBrand(silhouette.getBrand());
        }
        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", request.getCategoryId())));
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

    @Override
    @Transactional
    public void softDeleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));
        product.softDelete();
        productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductDetailResponse updateProductVisibility(Long id, boolean isVisible) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));
        if (isVisible) {
            product.restore();
        } else {
            product.softDelete();
        }
        return mapToDetailResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductDetailResponse updateProductDiscount(Long id, BigDecimal discountPercent) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", id));

        BigDecimal disc = discountPercent != null ? discountPercent : BigDecimal.ZERO;
        if (disc.compareTo(BigDecimal.ZERO) < 0 || disc.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Phần trăm giảm giá phải từ 0% đến 100%");
        }

        product.setDiscountPercent(disc);
        BigDecimal base = product.getBasePrice();
        product.setPrice(base.subtract(base.multiply(disc).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP)));
        
        return mapToDetailResponse(productRepository.save(product));
    }

    private Product attachImages(Product product, List<MultipartFile> files, boolean firstIsPrimary) {
        if (files == null || files.isEmpty()) return product;
        boolean makePrimary = firstIsPrimary && product.getImages().isEmpty();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            try {
                String imageName = cloudinaryService.upload(file);
                product.getImages().add(Image.builder()
                        .product(product)
                        .imageName(imageName)
                        .imageUrl(cloudinaryService.creteImageUrl(imageName))
                        .isPrimary(makePrimary)
                        .build());
                makePrimary = false;
            } catch (Exception e) {
                throw new BadRequestException("Lỗi khi upload ảnh: " + e.getMessage());
            }
        }
        return productRepository.save(product);
    }

    private ProductResponse mapToResponse(Product product) {
        String imageUrl = product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(this::resolveImageUrl).findFirst()
                .orElse(product.getImages().isEmpty() ? null : resolveImageUrl(product.getImages().get(0)));

        BrandResponse brandResponse = null;
        if (product.getSilhouette() != null && product.getSilhouette().getBrand() != null) {
            Brand brand = product.getSilhouette().getBrand();
            brandResponse = BrandResponse.builder()
                    .id(brand.getId()).name(brand.getName())
                    .slug(brand.getSlug())
                    .logoUrl(brand.getLogoUrl()).description(brand.getDescription()).build();
        } else if (product.getBrand() != null) {
            Brand brand = product.getBrand();
            brandResponse = BrandResponse.builder()
                    .id(brand.getId()).name(brand.getName())
                    .slug(brand.getSlug())
                    .logoUrl(brand.getLogoUrl()).description(brand.getDescription()).build();
        }

        int totalStock = product.getVariants().stream()
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0).sum();

        boolean isNew = product.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS));
        Integer totalSold = product.getTotalSold() != null ? product.getTotalSold()
                : (orderItemRepository != null ? orderItemRepository.countTotalSoldByProductId(product.getId()) : 0);

        return ProductResponse.builder()
                .id(product.getId()).name(product.getName()).brand(brandResponse)
                .basePrice(product.getBasePrice()).discountPercent(product.getDiscountPercent())
                .price(product.getPrice()).defaultImageUrl(imageUrl)
                .gender(product.getGender() != null ? product.getGender().name() : null)
                .isFeatured(product.getIsFeatured()).isNew(isNew)
                .isDeleted(product.getIsDeleted()).totalStock(totalStock)
                .totalSold(totalSold != null ? totalSold : 0).build();
    }

    private ProductDetailResponse mapToDetailResponse(Product product) {
        BrandResponse brandResponse = null;
        if (product.getSilhouette() != null && product.getSilhouette().getBrand() != null) {
            Brand brand = product.getSilhouette().getBrand();
            brandResponse = BrandResponse.builder()
                    .id(brand.getId()).name(brand.getName())
                    .slug(brand.getSlug())
                    .logoUrl(brand.getLogoUrl()).description(brand.getDescription()).build();
        } else if (product.getBrand() != null) {
            Brand brand = product.getBrand();
            brandResponse = BrandResponse.builder()
                    .id(brand.getId()).name(brand.getName())
                    .slug(brand.getSlug())
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
                    .id(product.getSilhouette().getId())
                    .name(product.getSilhouette().getName())
                    .slug(product.getSilhouette().getSlug())
                    .build();
        }

        List<ImageResponse> imageResponses = product.getImages().stream()
                .map(img -> ImageResponse.builder().id(img.getId())
                        .imageUrl(resolveImageUrl(img))
                        .isPrimary(img.getIsPrimary()).build())
                .collect(Collectors.toList());

        List<ProductVariantResponse> variantResponses = product.getVariants().stream()
                .map(v -> ProductVariantResponse.builder().id(v.getId())
                        .sku(v.getSku()).color(v.getColor()).size(v.getSize()).stock(v.getStockQuantity())
                        .priceMultiplier(v.getPriceAdjustment())
                        .originalPrice(v.getOriginalPrice())
                        .finalPrice(v.getFinalPrice()).build())
                .collect(Collectors.toList());

        boolean isNew = product.getCreatedAt().isAfter(Instant.now().minus(7, ChronoUnit.DAYS));
        Integer totalSold = product.getTotalSold() != null ? product.getTotalSold()
                : (orderItemRepository != null ? orderItemRepository.countTotalSoldByProductId(product.getId()) : 0);

        return ProductDetailResponse.builder()
                .id(product.getId()).name(product.getName()).description(product.getDescription())
                .basePrice(product.getBasePrice()).discountPercent(product.getDiscountPercent())
                .price(product.getPrice()).brand(brandResponse).category(categoryResponse)
                .silhouette(silhouetteResponse)
                .gender(product.getGender() != null ? product.getGender().name() : null)
                .productType(product.getProductType() != null ? product.getProductType().name() : null)
                .attributes(product.getAttributes())
                .isFeatured(product.getIsFeatured()).isNew(isNew).isDeleted(product.getIsDeleted())
                .totalSold(totalSold != null ? totalSold : 0)
                .images(imageResponses).variants(variantResponses).build();
    }

    private String resolveImageUrl(Image image) {
        String storedUrl = image.getImageUrl();
        return cloudinaryService.creteImageUrl(
                storedUrl != null && !storedUrl.isBlank() ? storedUrl : image.getImageName());
    }

    private String toSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }

    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction dir = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        if ("totalSold".equalsIgnoreCase(sortBy) || "isFeatured".equalsIgnoreCase(sortBy)) {
            return dir == Sort.Direction.DESC
                    ? Sort.by(Sort.Order.desc("totalSold"), Sort.Order.desc("isFeatured"), Sort.Order.asc("id"))
                    : Sort.by(Sort.Order.asc("totalSold"), Sort.Order.asc("isFeatured"), Sort.Order.asc("id"));
        }
        if ("price".equalsIgnoreCase(sortBy)) {
            return Sort.by(dir, "basePrice");
        }
        return Sort.by(dir, sortBy);
    }
}
