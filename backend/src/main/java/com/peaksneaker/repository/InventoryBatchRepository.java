package com.peaksneaker.repository;

import com.peaksneaker.entity.InventoryBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long>, JpaSpecificationExecutor<InventoryBatch> {
    List<InventoryBatch> findByVariantId(Long variantId);
    List<InventoryBatch> findByVariantIdOrderByReceivedDateDescIdDesc(Long variantId);
    List<InventoryBatch> findByVariantIdAndQuantityRemainingGreaterThanOrderByReceivedDateAscIdAsc(
            Long variantId, Integer quantityRemaining);
    List<InventoryBatch> findByVariantIdAndQuantityRemainingGreaterThanAndIsQuarantinedFalseOrderByReceivedDateAscIdAsc(
            Long variantId, Integer quantityRemaining);
    Page<InventoryBatch> findByVariantId(Long variantId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"variant", "variant.product", "variant.product.brand"})
    Page<InventoryBatch> findAll(Specification<InventoryBatch> spec, Pageable pageable);

    Optional<InventoryBatch> findByBatchCode(String batchCode);
    boolean existsByBatchCode(String batchCode);
    long countByQuantityRemainingGreaterThanAndReceivedDateBefore(Integer quantityRemaining, Instant receivedBefore);
}
