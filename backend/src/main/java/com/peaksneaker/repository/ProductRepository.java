package com.peaksneaker.repository;

import com.peaksneaker.entity.Category;
import com.peaksneaker.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;


@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Product> findByCategoryAndIsDeleted(Category category, Boolean isDeleted, Pageable pageable);

    Page<Product> findByIsDeleted(Boolean isDeleted, Pageable pageable);

    // Dùng cho HomePage
    Page<Product> findByIsFeaturedTrueAndIsDeletedFalse(Pageable pageable);

    Page<Product> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<Product> findByGenderAndIsDeleted(String gender, Boolean isDeleted, Pageable pageable);

    Page<Product> findByProductTypeAndIsDeleted(String productType, Boolean isDeleted, Pageable pageable);

    boolean existsByName(String name);
}
