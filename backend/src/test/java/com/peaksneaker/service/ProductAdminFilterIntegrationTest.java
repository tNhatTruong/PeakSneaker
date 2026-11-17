package com.peaksneaker.service;

import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.AdminProductFilterOptionResponse;
import com.peaksneaker.dto.response.ProductDetailResponse;
import com.peaksneaker.dto.response.ProductResponse;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.AdminProductStatus;
import com.peaksneaker.enums.AdminProductStockStatus;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ProductAdminFilterIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void adminFilterOptionsShouldIncludeAccessoryProductsWithoutSilhouette() {
        Long accessoryCategoryId = categoryRepository.findBySlug("phu-kien-sneaker")
                .orElseThrow()
                .getId();

        assertThat(productService.getAdminFilterOptions())
                .anySatisfy(option -> {
                    assertThat(option.getCategoryId()).isEqualTo(accessoryCategoryId);
                    assertThat(option.getBrandId()).isNotNull();
                    assertThat(option.getSilhouetteId()).isNull();
                });
    }

    @Test
    void adminFilterOptionsShouldRepresentExistingProductRelations() {
        AdminProductFilterOptionResponse option = productService.getAdminFilterOptions().stream()
                .findFirst()
                .orElseThrow();

        PaginatedResponse<ProductResponse> result = productService.filterProductsAdmin(
                null, null, option.getBrandId(), option.getCategoryId(), option.getSilhouetteId(),
                null, null, null, 0, 20, "createdAt", "desc");

        assertThat(result.getItems()).isNotEmpty();
    }

    @Test
    void adminProductSearchShouldMatchVariantSku() {
        ProductVariant variant = productVariantRepository.findAll().stream()
                .filter(item -> item.getSku() != null && !item.getSku().isBlank())
                .findFirst()
                .orElseThrow();

        PaginatedResponse<ProductResponse> result = productService.filterProductsAdmin(
                variant.getSku(), null, null, null, null, null,
                null, null, 0, 20, "createdAt", "desc");

        assertThat(result.getItems())
                .extracting(ProductResponse::getId)
                .contains(variant.getProduct().getId());
    }

    @Test
    void adminProductFiltersShouldComposeAcrossCatalogDimensions() {
        ProductResponse candidate = productService.filterProductsAdmin(
                        null, AdminProductStatus.ACTIVE, null, null, null,
                        AdminProductStockStatus.IN_STOCK, null, null,
                        0, 100, "createdAt", "desc")
                .getItems().stream()
                .filter(item -> item.getBrand() != null && item.getTotalStock() != null && item.getTotalStock() > 0)
                .findFirst()
                .orElseThrow();
        ProductDetailResponse detail = productService.getProductById(candidate.getId());
        BigDecimal price = candidate.getBasePrice();

        PaginatedResponse<ProductResponse> result = productService.filterProductsAdmin(
                candidate.getName(),
                AdminProductStatus.ACTIVE,
                candidate.getBrand().getId(),
                detail.getCategory() != null ? detail.getCategory().getId() : null,
                detail.getSilhouette() != null ? detail.getSilhouette().getId() : null,
                AdminProductStockStatus.IN_STOCK,
                price,
                price,
                0,
                20,
                "createdAt",
                "desc");

        assertThat(result.getItems())
                .isNotEmpty()
                .allSatisfy(item -> {
                    assertThat(item.getIsDeleted()).isFalse();
                    assertThat(item.getBrand().getId()).isEqualTo(candidate.getBrand().getId());
                    assertThat(item.getTotalStock()).isPositive();
                    assertThat(item.getBasePrice()).isEqualByComparingTo(price);
                });
    }

    @Test
    void adminStockFiltersShouldCoverLowAndOutOfStockProducts() {
        PaginatedResponse<ProductResponse> lowStock = productService.filterProductsAdmin(
                null, null, null, null, null, AdminProductStockStatus.LOW_STOCK,
                null, null, 0, 100, "createdAt", "desc");
        PaginatedResponse<ProductResponse> outOfStock = productService.filterProductsAdmin(
                null, null, null, null, null, AdminProductStockStatus.OUT_OF_STOCK,
                null, null, 0, 100, "createdAt", "desc");

        assertThat(lowStock.getItems())
                .isNotEmpty()
                .allSatisfy(item -> assertThat(productService.getProductById(item.getId()).getVariants())
                        .anySatisfy(variant -> assertThat(variant.getStock()).isBetween(1, 9)));
        assertThat(outOfStock.getItems())
                .isNotEmpty()
                .allSatisfy(item -> assertThat(item.getTotalStock()).isZero());
    }

    @Test
    void filterProductsShouldSortByTotalSoldDescending() {
        PaginatedResponse<ProductResponse> result = productService.filterProducts(
                null, null, null, null, null, null, null, null, 0, 10, "totalSold", "desc");

        assertThat(result.getItems()).isNotEmpty();
        for (int i = 0; i < result.getItems().size() - 1; i++) {
            ProductResponse current = result.getItems().get(i);
            ProductResponse next = result.getItems().get(i + 1);
            assertThat(current.getTotalSold())
                    .as("Product %s (totalSold=%d) should have totalSold >= Product %s (totalSold=%d)",
                            current.getName(), current.getTotalSold(), next.getName(), next.getTotalSold())
                    .isGreaterThanOrEqualTo(next.getTotalSold());
        }
    }

    @Test
    void filterProductsWithIsFeaturedShouldAlsoSortByTotalSoldDescending() {
        PaginatedResponse<ProductResponse> result = productService.filterProducts(
                null, null, null, null, null, null, null, null, 0, 10, "isFeatured", "desc");

        assertThat(result.getItems()).isNotEmpty();
        for (int i = 0; i < result.getItems().size() - 1; i++) {
            ProductResponse current = result.getItems().get(i);
            ProductResponse next = result.getItems().get(i + 1);
            assertThat(current.getTotalSold())
                    .as("Product %s (totalSold=%d) should have totalSold >= Product %s (totalSold=%d)",
                            current.getName(), current.getTotalSold(), next.getName(), next.getTotalSold())
                    .isGreaterThanOrEqualTo(next.getTotalSold());
        }
    }

    @Test
    void getSaleProductsShouldReturnOnlyDiscountedProducts() {
        List<ProductResponse> saleProducts = productService.getSaleProducts(12);

        assertThat(saleProducts).isNotEmpty();
        assertThat(saleProducts).allSatisfy(item -> {
            assertThat(item.getDiscountPercent()).isNotNull();
            assertThat(item.getDiscountPercent()).isGreaterThan(BigDecimal.ZERO);
            assertThat(item.getPrice()).isNotNull();
            assertThat(item.getPrice()).isLessThan(item.getBasePrice());
        });

        for (int i = 0; i < saleProducts.size() - 1; i++) {
            ProductResponse current = saleProducts.get(i);
            ProductResponse next = saleProducts.get(i + 1);
            assertThat(current.getDiscountPercent()).isGreaterThanOrEqualTo(next.getDiscountPercent());
        }
    }

    @Test
    void filterProductsWithOnSaleTrueShouldReturnOnlyDiscountedProducts() {
        PaginatedResponse<ProductResponse> result = productService.filterProducts(
                null, null, null, null, true, null, null, null, null, 0, 20, "createdAt", "desc");

        assertThat(result.getItems()).isNotEmpty();
        assertThat(result.getItems()).allSatisfy(item -> {
            assertThat(item.getDiscountPercent()).isNotNull();
            assertThat(item.getDiscountPercent()).isGreaterThan(BigDecimal.ZERO);
        });
    }
}
