package com.peaksneaker.repository;

import com.peaksneaker.entity.InventoryForecast;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryForecastRepository extends JpaRepository<InventoryForecast, Long> {
    Optional<InventoryForecast> findByVariantId(Long variantId);
    List<InventoryForecast> findByIsDeadstockTrue();
    Page<InventoryForecast> findByIsDeadstockTrue(Pageable pageable);
}
