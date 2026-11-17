package com.peaksneaker.repository;

import com.peaksneaker.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, String status);
    Page<ProductReview> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, String status, Pageable pageable);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    Optional<ProductReview> findFirstByUserIdAndProductId(Long userId, Long productId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId AND r.status = 'APPROVED'")
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    long countByProductIdAndStatus(Long productId, String status);
}
