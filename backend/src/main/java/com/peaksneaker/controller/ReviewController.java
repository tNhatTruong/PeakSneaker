package com.peaksneaker.controller;

import com.peaksneaker.dto.request.ReviewRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.ReviewResponse;
import com.peaksneaker.dto.response.ReviewStatsResponse;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewResponse> reviews = reviewService.getProductReviews(productId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá thành công", reviews));
    }

    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<ApiResponse<ReviewStatsResponse>> getProductReviewStats(@PathVariable Long productId) {
        ReviewStatsResponse stats = reviewService.getProductReviewStats(productId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê đánh giá thành công", stats));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> addOrUpdateReview(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ReviewRequest request) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Người dùng chưa được xác thực.");
        }
        ReviewResponse response = reviewService.addOrUpdateReview(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Lưu đánh giá thành công", response));
    }

    @GetMapping("/product/{productId}/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> getMyReview(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long productId) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Người dùng chưa được xác thực.");
        }
        ReviewResponse review = reviewService.getMyReview(userDetails.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Lấy đánh giá cá nhân thành công", review));
    }

    @GetMapping("/product/{productId}/can-review")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> checkCanReview(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long productId) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.success("Trạng thái", false));
        }
        boolean canReview = reviewService.checkCanReview(userDetails.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái thành công", canReview));
    }
}
