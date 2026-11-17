package com.peaksneaker.repository;

import com.peaksneaker.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {
    long countByVoucherIdAndUserId(Long voucherId, Long userId);
    List<VoucherUsage> findByUserId(Long userId);
    List<VoucherUsage> findByOrderId(Long orderId);
}
