package com.peaksneaker.repository;

import com.peaksneaker.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    @Query("""
                SELECT v
                 FROM Voucher v
                 WHERE (:query IS NULL OR :query ='' OR LOWER(v.code) LIKE LOWER(CONCAT('%',:query,'%')))
                     AND (:isActive IS NULL OR v.isActive = :isActive)
                     AND (v.isDeleted = false OR v.isDeleted IS NULL)
                 ORDER BY v.id DESC
            """)
    Page<Voucher> search(@Param("query") String query, @Param("isActive") Boolean isActive, Pageable pageable);
}
