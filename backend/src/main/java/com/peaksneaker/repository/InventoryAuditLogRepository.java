package com.peaksneaker.repository;

import com.peaksneaker.entity.InventoryAuditLog;
import com.peaksneaker.enums.InventoryChangeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface InventoryAuditLogRepository extends JpaRepository<InventoryAuditLog, Long>, JpaSpecificationExecutor<InventoryAuditLog> {
    List<InventoryAuditLog> findByVariantIdOrderByCreatedAtDesc(Long variantId);
    Page<InventoryAuditLog> findByVariantIdOrderByCreatedAtDesc(Long variantId, Pageable pageable);
    Page<InventoryAuditLog> findByChangeTypeOrderByCreatedAtDesc(InventoryChangeType changeType, Pageable pageable);
    long countByChangeTypeIn(Collection<InventoryChangeType> changeTypes);

    @Query("SELECT DISTINCT l.performedBy FROM InventoryAuditLog l WHERE l.performedBy IS NOT NULL AND l.performedBy <> '' ORDER BY l.performedBy ASC")
    List<String> findDistinctPerformers();
}
