package com.peaksneaker.service;

import com.peaksneaker.dto.request.ReviewRequest;
import com.peaksneaker.dto.response.ReviewResponse;
import com.peaksneaker.dto.response.ReviewStatsResponse;
import org.springframework.data.domain.Page;

public interface ReviewService {
    ReviewResponse addOrUpdateReview(Long userId, ReviewRequest request);
    Page<ReviewResponse> getProductReviews(Long productId, int page, int size);
    ReviewStatsResponse getProductReviewStats(Long productId);
    boolean checkCanReview(Long userId, Long productId);
    ReviewResponse getMyReview(Long userId, Long productId);
}
