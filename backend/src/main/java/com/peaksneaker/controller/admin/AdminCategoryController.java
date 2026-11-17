package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.CategoryRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.CategoryResponse;
import com.peaksneaker.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách danh mục quản trị thành công",
                categoryService.getAllCategoriesForAdmin()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.createCategory(request);
        return ResponseEntity.ok(ApiResponse.success("Thêm mới danh mục thành công", category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công", category));
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateVisibility(
            @PathVariable Long id,
            @RequestParam boolean isActive) {
        CategoryResponse category = categoryService.updateVisibility(id, isActive);
        return ResponseEntity.ok(ApiResponse.success(
                isActive ? "Đã hiển thị danh mục" : "Đã ẩn danh mục",
                category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công", null));
    }
}
