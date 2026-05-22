package com.peaksneaker.service;

import com.peaksneaker.entity.Category;

import java.util.List;

public interface CategoryService {
    Category getCategoryById(Long id);
    List<Category> getAllCategories();
    void saveCategory(Category category);
    void deleteCategory(Category category);
}
