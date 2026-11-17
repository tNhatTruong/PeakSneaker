package com.peaksneaker.repository;

import com.peaksneaker.entity.ShipmentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, Long> {
    boolean existsByEventKey(String eventKey);
    List<ShipmentEvent> findByShipmentIdOrderByOccurredAtAscIdAsc(Long shipmentId);
}
