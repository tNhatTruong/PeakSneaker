package com.peaksneaker.repository;

import com.peaksneaker.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    List<Image> findByProductId(Long productId);

    List<Image> findByProductVariantId(Long variantId);

    Optional<Image> findByProductIdAndIsPrimaryTrue(Long productId);

    Optional<Image> findByProductVariantIdAndIsPrimaryTrue(Long variantId);

    void deleteByProductId(Long productId);

    void deleteByProductVariantId(Long variantId);
}
