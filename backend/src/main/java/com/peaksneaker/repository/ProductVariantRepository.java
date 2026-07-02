package com.peaksneaker.repository;

import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProduct(Product product);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);

    List<ProductVariant> findByStockQuantityLessThan(Integer threshold);

    @Query("SELECT COUNT(v) FROM ProductVariant v WHERE v.stockQuantity <= :threshold AND v.product.isDeleted = false")
    long countLowStockVariants(@Param("threshold") Integer threshold);
}
