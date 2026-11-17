package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.ReviewRequest;
import com.peaksneaker.dto.response.ReviewResponse;
import com.peaksneaker.dto.response.ReviewStatsResponse;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductReview;
import com.peaksneaker.entity.User;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.ProductReviewRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.ReviewService;
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
public class ReviewServiceImpl implements ReviewService {

    private static final String APPROVED_STATUS = "APPROVED";

    private final ProductReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse addOrUpdateReview(Long userId, ReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", request.getProductId()));

        boolean hasPurchased = orderRepository.existsByUserIdAndProductIdAndStatusCompleted(
                userId, request.getProductId());
        if (!hasPurchased) {
            throw new BadRequestException(
                    "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Optional<ProductReview> existingReview = reviewRepository.findFirstByUserIdAndProductId(
                userId, request.getProductId());
        ProductReview review = existingReview.orElseGet(() -> ProductReview.builder()
                .user(user)
                .product(product)
                .isVerifiedPurchase(true)
                .status(APPROVED_STATUS)
                .build());

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsVerifiedPurchase(true);
        review.setStatus(APPROVED_STATUS);

        return mapToResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(
                        productId, APPROVED_STATUS, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewStatsResponse getProductReviewStats(Long productId) {
        Double average = reviewRepository.getAverageRatingByProductId(productId);
        long total = reviewRepository.countByProductIdAndStatus(productId, APPROVED_STATUS);
        return ReviewStatsResponse.builder()
                .averageRating(average != null ? Math.round(average * 10.0) / 10.0 : 0.0)
                .totalReviews(total)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkCanReview(Long userId, Long productId) {
        return userId != null
                && orderRepository.existsByUserIdAndProductIdAndStatusCompleted(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(Long userId, Long productId) {
        if (userId == null) {
            return null;
        }
        return reviewRepository.findFirstByUserIdAndProductId(userId, productId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    private ReviewResponse mapToResponse(ProductReview review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullname())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
