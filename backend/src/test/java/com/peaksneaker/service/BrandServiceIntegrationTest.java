package com.peaksneaker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.exception.BadRequestException;

@SpringBootTest
class BrandServiceIntegrationTest {

    @Autowired
    private BrandService brandService;

    @Test
    void searchBrandsCalculatesStorefrontVisibilityAndActiveProductCountsAccurately() {
        List<BrandResponse> brands = brandService.searchBrands(null);

        assertThat(brands).isNotEmpty();
        assertThat(brands).allSatisfy(brand -> {
            assertThat(brand.getName()).isNotBlank();
            assertThat(brand.getSlug()).isNotBlank();
            assertThat(brand.getActiveProductCount()).isNotNegative();

            boolean expectedVisible = Boolean.TRUE.equals(brand.getIsActive()) && brand.getActiveProductCount() > 0;
            assertThat(brand.getIsVisible()).isEqualTo(expectedVisible);
        });
    }

    @Test
    void searchBrandsWithKeywordReturnsFilteredMatches() {
        List<BrandResponse> brands = brandService.searchBrands("Nike");

        assertThat(brands).isNotEmpty();
        assertThat(brands).allMatch(brand -> brand.getName().toLowerCase().contains("nike"));
    }

    @Test
    void deleteBrandWithExistingProductsOrSilhouettesThrowsBadRequestException() {
        List<BrandResponse> brands = brandService.searchBrands(null);
        BrandResponse brandWithAssets = brands.stream()
                .filter(b -> b.getActiveProductCount() > 0 || (b.getSilhouettes() != null && !b.getSilhouettes().isEmpty()))
                .findFirst()
                .orElse(null);

        assertThat(brandWithAssets).isNotNull();

        assertThatThrownBy(() -> brandService.deleteBrand(brandWithAssets.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể xóa thương hiệu đang có");
    }
}

