package com.peaksneaker.repository;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;


@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrder(Order order);

    @Query("SELECT oi.productVariant.product.id, oi.productName, SUM(oi.quantity), MAX(oi.unitPrice) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = com.peaksneaker.enums.OrderStatus.COMPLETED " +
           "GROUP BY oi.productVariant.product.id, oi.productName " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);

    @Query("SELECT oi.productVariant.product.id, oi.productName, SUM(oi.quantity), MAX(oi.unitPrice), SUM(oi.subtotal) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = com.peaksneaker.enums.OrderStatus.COMPLETED " +
           "AND oi.order.createdAt BETWEEN :start AND :end " +
           "GROUP BY oi.productVariant.product.id, oi.productName " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProductsBetween(
            @Param("start") Instant start,
            @Param("end") Instant end,
            Pageable pageable);

    @Query("SELECT oi.productVariant.product.brand.name, SUM(oi.subtotal) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = com.peaksneaker.enums.OrderStatus.COMPLETED " +
           "AND oi.order.createdAt BETWEEN :start AND :end " +
           "GROUP BY oi.productVariant.product.brand.id, oi.productVariant.product.brand.name " +
           "ORDER BY SUM(oi.subtotal) DESC")
    List<Object[]> findBrandSalesBetween(
            @Param("start") Instant start,
            @Param("end") Instant end,
            Pageable pageable);

    @Query("""
            SELECT oi.productVariant.id, COALESCE(SUM(oi.quantity), 0)
            FROM OrderItem oi
            WHERE oi.order.status <> com.peaksneaker.enums.OrderStatus.CANCELLED
              AND oi.order.createdAt >= :since
            GROUP BY oi.productVariant.id
            """)
    List<Object[]> findVariantSalesSince(@Param("since") Instant since);

    @Query("""
            SELECT oi.productVariant.id, COALESCE(SUM(oi.quantity), 0)
            FROM OrderItem oi
            WHERE oi.order.status <> com.peaksneaker.enums.OrderStatus.CANCELLED
              AND oi.order.createdAt BETWEEN :start AND :end
            GROUP BY oi.productVariant.id
            """)
    List<Object[]> findVariantSalesBetween(
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT oi FROM OrderItem oi JOIN FETCH oi.order o WHERE oi.productVariant.id = :variantId ORDER BY o.createdAt DESC")
    List<OrderItem> findByProductVariantIdWithOrder(@Param("variantId") Long variantId, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM OrderItem oi
            WHERE oi.productVariant.product.id = :productId
              AND oi.order.status <> com.peaksneaker.enums.OrderStatus.CANCELLED
            """)
    Integer countTotalSoldByProductId(@Param("productId") Long productId);
}
