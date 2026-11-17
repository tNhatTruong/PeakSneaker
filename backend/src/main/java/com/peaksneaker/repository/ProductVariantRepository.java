package com.peaksneaker.repository;

import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long>, JpaSpecificationExecutor<ProductVariant> {

    List<ProductVariant> findByProduct(Product product);

    List<ProductVariant> findByProductId(Long productId);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);

    List<ProductVariant> findByStockQuantityLessThan(Integer threshold);

    @Query("SELECT COUNT(v) FROM ProductVariant v WHERE v.stockQuantity <= COALESCE(v.safetyStockThreshold, :threshold) AND v.product.isDeleted = false")
    long countLowStockVariants(@Param("threshold") Integer threshold);

    @Query("SELECT v FROM ProductVariant v WHERE v.stockQuantity <= COALESCE(v.safetyStockThreshold, :threshold) AND v.product.isDeleted = false ORDER BY v.stockQuantity ASC, v.id ASC")
    List<ProductVariant> findLowStockVariants(@Param("threshold") Integer threshold, Pageable pageable);

    @Query("""
            SELECT DISTINCT v.size
            FROM ProductVariant v
            JOIN v.product p
            WHERE p.isDeleted = false
              AND p.productType = com.peaksneaker.enums.ProductType.SNEAKER
              AND v.stockQuantity > 0
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:brandId IS NULL OR p.brand.id = :brandId)
              AND (:silhouetteId IS NULL OR p.silhouette.id = :silhouetteId)
            ORDER BY v.size ASC
            """)
    List<String> findAvailableSizes(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("silhouetteId") Long silhouetteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM ProductVariant v WHERE v.id = :id")
    Optional<ProductVariant> findByIdWithLock(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT v
            FROM ProductVariant v
            JOIN FETCH v.product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.category
            LEFT JOIN FETCH p.images
            WHERE p.isDeleted = false
            """)
    List<ProductVariant> findAllActiveWithProductAndImages();
}
