package com.peaksneaker.repository;

import com.peaksneaker.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    Optional<Voucher> findByCode(String code);

    boolean existsByCode(String code);

    Page<Voucher> findByIsActive(Boolean isActive, Pageable pageable);

    Page<Voucher> findByCodeContainingIgnoreCase(String code, Pageable pageable);
}
