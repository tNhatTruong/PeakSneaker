package com.peaksneaker.service;

import com.peaksneaker.dto.request.ReviewRequest;
import com.peaksneaker.dto.response.ReviewResponse;
import com.peaksneaker.dto.response.ReviewStatsResponse;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.Review;
import com.peaksneaker.entity.User;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.ReviewRepository;
import com.peaksneaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse addOrUpdateReview(Long userId, ReviewRequest request) {
        // Kiểm tra xem sản phẩm có tồn tại không
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại"));

        // Kiểm tra xem người dùng đã mua sản phẩm và hoàn thành đơn hàng chưa
        boolean hasPurchased = orderRepository.existsByUserIdAndProductIdAndStatusCompleted(userId, request.getProductId());
        if (!hasPurchased) {
            throw new IllegalArgumentException("Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        // Kiểm tra xem đã có đánh giá chưa
        Optional<Review> existingReviewOpt = reviewRepository.findByUserIdAndProductIdAndIsDeletedFalse(userId, request.getProductId());
        
        Review review;
        if (existingReviewOpt.isPresent()) {
            review = existingReviewOpt.get();
            if (Boolean.TRUE.equals(review.getIsEdited())) {
                throw new IllegalArgumentException("Bạn chỉ được phép chỉnh sửa đánh giá 1 lần duy nhất.");
            }
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            review.setIsEdited(true);
        } else {
            review = Review.builder()
                    .user(user)
                    .product(product)
                    .rating(request.getRating())
                    .comment(request.getComment())
                    .isDeleted(false)
                    .isEdited(false)
                    .build();
        }

        review = reviewRepository.save(review);
        return mapToResponse(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByProductIdAndIsDeletedFalse(productId, pageable);
        return reviews.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ReviewStatsResponse getProductReviewStats(Long productId) {
        Double avg = reviewRepository.getAverageRatingByProductId(productId);
        Long total = reviewRepository.countByProductIdAndIsDeletedFalse(productId);
        return ReviewStatsResponse.builder()
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalReviews(total != null ? total : 0L)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean checkCanReview(Long userId, Long productId) {
        if (userId == null) return false;
        return orderRepository.existsByUserIdAndProductIdAndStatusCompleted(userId, productId);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(Long userId, Long productId) {
        if (userId == null) return null;
        return reviewRepository.findByUserIdAndProductIdAndIsDeletedFalse(userId, productId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullname())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .isEdited(review.getIsEdited())
                .build();
    }
}
