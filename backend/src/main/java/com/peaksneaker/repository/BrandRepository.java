package com.peaksneaker.repository;

import com.peaksneaker.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    @Query("""
            SELECT b
            FROM Brand b
            WHERE b.isActive = true
              AND EXISTS (
                  SELECT p.id
                  FROM Product p
                  WHERE p.brand = b AND p.isDeleted = false
              )
            ORDER BY b.name ASC
            """)
    List<Brand> findAllPubliclyVisible();

    List<Brand> findAllByOrderByNameAsc();
}
