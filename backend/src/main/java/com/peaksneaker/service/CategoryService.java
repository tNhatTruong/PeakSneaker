package com.peaksneaker.service;

import com.peaksneaker.dto.request.CategoryRequest;
import com.peaksneaker.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    List<CategoryResponse> getAllCategoriesForAdmin();
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    CategoryResponse updateVisibility(Long id, boolean isActive);
    void deleteCategory(Long id);
}
