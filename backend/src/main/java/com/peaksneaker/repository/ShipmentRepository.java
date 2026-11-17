package com.peaksneaker.repository;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.Shipment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByProviderOrderCode(String providerOrderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select shipment from Shipment shipment join fetch shipment.order where shipment.providerOrderCode = :providerOrderCode")
    Optional<Shipment> findByProviderOrderCodeForUpdate(@Param("providerOrderCode") String providerOrderCode);

    Optional<Shipment> findFirstByOrderOrderByCreatedAtDesc(Order order);
    List<Shipment> findByOrderOrderByCreatedAtDesc(Order order);
}
