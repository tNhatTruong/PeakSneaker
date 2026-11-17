package com.peaksneaker.repository;

import com.peaksneaker.entity.Voucher;
import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.VoucherApplicationScope;
import com.peaksneaker.enums.VoucherChannel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.time.Instant;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Voucher v WHERE v.code = :code")
    Optional<Voucher> findByCodeWithLock(@Param("code") String code);

    @Query("""
            SELECT v
            FROM Voucher v
            WHERE (
                :query IS NULL OR :query = ''
                OR LOWER(v.code) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(v.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(COALESCE(v.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            AND (:isActive IS NULL OR v.isActive = :isActive)
            AND (:discountType IS NULL OR v.discountType = :discountType)
            AND (:applicationScope IS NULL OR v.applicationScope = :applicationScope)
            AND (:applicationChannel IS NULL OR v.applicationChannel = :applicationChannel)
            AND v.expireAt >= :fromDate
            AND v.startAt <= :toDate
            AND (
                :status IS NULL
                OR (:status = 'PAUSED' AND v.isActive = false)
                OR (:status = 'UPCOMING' AND v.isActive = true AND v.startAt > :now)
                OR (:status = 'EXPIRED' AND v.isActive = true
                    AND (v.expireAt < :now OR (v.usageLimit IS NOT NULL AND v.usedCount >= v.usageLimit)))
                OR (:status = 'ACTIVE' AND v.isActive = true
                    AND v.startAt <= :now AND v.expireAt >= :now
                    AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit))
            )
            """)
    Page<Voucher> search(
            @Param("query") String query,
            @Param("isActive") Boolean isActive,
            @Param("status") String status,
            @Param("discountType") DiscountType discountType,
            @Param("applicationScope") VoucherApplicationScope applicationScope,
            @Param("applicationChannel") VoucherChannel applicationChannel,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("now") Instant now,
            Pageable pageable);
}
