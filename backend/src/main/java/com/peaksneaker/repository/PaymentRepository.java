package com.peaksneaker.repository;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;


@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrder(Order order);

    Optional<Payment> findByTransactionId(String transactionId);

    Page<Payment> findByStatus(String status, Pageable pageable);

    List<Payment> findByCreatedAtBetween(Instant start, Instant end);
}
