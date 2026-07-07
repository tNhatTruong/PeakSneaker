package com.peaksneaker.repository;

import com.peaksneaker.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    Page<Review> findByProductIdAndIsDeletedFalse(Long productId, Pageable pageable);

    Optional<Review> findByUserIdAndProductIdAndIsDeletedFalse(Long userId, Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.isDeleted = false")
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    Long countByProductIdAndIsDeletedFalse(Long productId);
}
