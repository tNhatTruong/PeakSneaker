package com.peaksneaker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.peaksneaker.dto.request.CategoryRequest;
import com.peaksneaker.dto.response.CategoryResponse;
import com.peaksneaker.exception.BadRequestException;

@SpringBootTest
class CategoryServiceIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Test
    void getAllCategoriesForAdminCalculatesProductCountsAndParentNames() {
        List<CategoryResponse> categories = categoryService.getAllCategoriesForAdmin();

        assertThat(categories).isNotEmpty();
        assertThat(categories).allSatisfy(cat -> {
            assertThat(cat.getName()).isNotBlank();
            assertThat(cat.getSlug()).isNotBlank();
            assertThat(cat.getProductCount()).isNotNegative();

            if (cat.getParentId() != null) {
                assertThat(cat.getParentName()).isNotBlank();
            }
        });
    }

    @Test
    void deleteCategoryWithProductsOrChildrenThrowsBadRequestException() {
        List<CategoryResponse> categories = categoryService.getAllCategoriesForAdmin();
        CategoryResponse categoryWithProducts = categories.stream()
                .filter(c -> c.getProductCount() != null && c.getProductCount() > 0)
                .findFirst()
                .orElse(null);

        assertThat(categoryWithProducts).isNotNull();

        assertThatThrownBy(() -> categoryService.deleteCategory(categoryWithProducts.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể xóa danh mục");
    }

    @Test
    void updateCategoryToHaveItselfAsParentThrowsBadRequestException() {
        List<CategoryResponse> categories = categoryService.getAllCategoriesForAdmin();
        CategoryResponse sample = categories.getFirst();

        CategoryRequest request = new CategoryRequest();
        request.setName(sample.getName());
        request.setDescription(sample.getDescription());
        request.setParentId(sample.getId());

        assertThatThrownBy(() -> categoryService.updateCategory(sample.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thể chọn chính nó");
    }

    @Test
    void updateVisibilityTogglesCategoryIsActive() {
        List<CategoryResponse> categories = categoryService.getAllCategoriesForAdmin();
        CategoryResponse sample = categories.getFirst();
        boolean originalStatus = Boolean.TRUE.equals(sample.getIsActive());

        CategoryResponse toggled = categoryService.updateVisibility(sample.getId(), !originalStatus);
        assertThat(toggled.getIsActive()).isEqualTo(!originalStatus);

        CategoryResponse restored = categoryService.updateVisibility(sample.getId(), originalStatus);
        assertThat(restored.getIsActive()).isEqualTo(originalStatus);
    }
}

