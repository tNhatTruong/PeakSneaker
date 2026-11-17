package com.peaksneaker.repository;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.User;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;


@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Order> {

    Page<Order> findByUser(User user, Pageable pageable);

    java.util.List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Order> findByUserIdAndCheckoutKey(Long userId, String checkoutKey);

    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT o FROM Order o WHERE LOWER(o.shippingName) LIKE LOWER(CONCAT('%', :query, '%')) OR o.shippingPhone LIKE CONCAT('%', :query, '%')")
    Page<Order> searchOrders(@Param("query") String query, Pageable pageable);

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByStatusAndCreatedAtBetween(OrderStatus status, Instant start, Instant end);

    long countByPaymentStatusAndCreatedAtBetween(PaymentStatus status, Instant start, Instant end);

    long countByPaymentMethodAndCreatedAtBetween(PaymentMethod method, Instant start, Instant end);

    long countByVoucherId(Long voucherId);

    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.status = com.peaksneaker.enums.OrderStatus.COMPLETED")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.status = com.peaksneaker.enums.OrderStatus.COMPLETED AND o.createdAt BETWEEN :start AND :end")
    BigDecimal calculateRevenueBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o JOIN o.items i WHERE o.user.id = :userId AND i.productVariant.product.id = :productId AND o.status IN (com.peaksneaker.enums.OrderStatus.DELIVERED, com.peaksneaker.enums.OrderStatus.COMPLETED)")
    boolean existsByUserIdAndProductIdAndStatusCompleted(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("""
            SELECT COALESCE(SUM(o.discountAmount), 0)
            FROM Order o
            WHERE o.voucher.id = :voucherId
              AND o.status <> com.peaksneaker.enums.OrderStatus.CANCELLED
            """)
    BigDecimal calculateVoucherDiscountTotal(@Param("voucherId") Long voucherId);

    @Query("SELECT o FROM Order o WHERE o.status = com.peaksneaker.enums.OrderStatus.PENDING AND o.paymentMethod = com.peaksneaker.enums.PaymentMethod.VNPAY AND o.createdAt < :cutoff")
    java.util.List<Order> findExpiredPendingOrders(@Param("cutoff") Instant cutoff);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM Order o
            WHERE o.voucher.id = :voucherId
              AND o.status <> com.peaksneaker.enums.OrderStatus.CANCELLED
            """)
    BigDecimal calculateVoucherGeneratedRevenue(@Param("voucherId") Long voucherId);
}
