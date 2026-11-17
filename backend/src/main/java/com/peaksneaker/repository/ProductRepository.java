package com.peaksneaker.repository;

import com.peaksneaker.entity.Category;
import com.peaksneaker.entity.Product;
import com.peaksneaker.dto.response.AdminProductFilterOptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Product> findByCategoryAndIsDeleted(Category category, Boolean isDeleted, Pageable pageable);

    Page<Product> findByIsDeleted(Boolean isDeleted, Pageable pageable);

    // Dùng cho HomePage
    Page<Product> findByIsFeaturedTrueAndIsDeletedFalse(Pageable pageable);

    Page<Product> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.discountPercent > 0 AND p.isDeleted = false ORDER BY p.discountPercent DESC, p.id ASC")
    Page<Product> findSaleProducts(Pageable pageable);

    Page<Product> findByGenderAndIsDeleted(String gender, Boolean isDeleted, Pageable pageable);

    Page<Product> findByProductTypeAndIsDeleted(String productType, Boolean isDeleted, Pageable pageable);

    boolean existsByName(String name);

    long countByBrandIdAndIsDeletedFalse(Long brandId);

    long countByBrandId(Long brandId);

    long countByCategoryIdAndIsDeletedFalse(Long categoryId);

    long countByCategoryId(Long categoryId);

    long countBySilhouetteId(Long silhouetteId);

    long countBySilhouetteIdAndIsDeletedFalse(Long silhouetteId);

    @Query("select p.silhouette.id, count(p) from Product p where p.isDeleted = false and p.silhouette is not null group by p.silhouette.id")
    List<Object[]> countActiveProductsGroupBySilhouette();

    @Query("""
            select distinct new com.peaksneaker.dto.response.AdminProductFilterOptionResponse(
                product.brand.id,
                product.category.id,
                silhouette.id
            )
            from Product product
            left join product.silhouette silhouette
            where product.isDeleted = false
              and product.brand is not null
              and product.category is not null
            """)
    List<AdminProductFilterOptionResponse> findActiveFilterOptions();

    @Query("""
            select distinct new com.peaksneaker.dto.response.AdminProductFilterOptionResponse(
                product.brand.id,
                product.category.id,
                silhouette.id
            )
            from Product product
            left join product.silhouette silhouette
            where product.brand is not null
              and product.category is not null
            """)
    List<AdminProductFilterOptionResponse> findAdminFilterOptions();
}
