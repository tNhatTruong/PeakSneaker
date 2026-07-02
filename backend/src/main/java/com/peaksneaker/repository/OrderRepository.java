package com.peaksneaker.repository;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.peaksneaker.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;


@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUser(User user, Pageable pageable);

    Page<Order> findByStatus(String status, Pageable pageable);

    Page<Order> findByPaymentStatus(String paymentStatus, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE LOWER(o.shippingName) LIKE LOWER(CONCAT('%', :query, '%')) OR o.shippingPhone LIKE CONCAT('%', :query, '%')")
    Page<Order> searchOrders(@Param("query") String query, Pageable pageable);

    List<Order> findByCreatedAtBetween(Instant start, Instant end);

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end);

    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.status = 'COMPLETED'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt BETWEEN :start AND :end")
    BigDecimal calculateRevenueBetween(@Param("start") Instant start, @Param("end") Instant end);
}
