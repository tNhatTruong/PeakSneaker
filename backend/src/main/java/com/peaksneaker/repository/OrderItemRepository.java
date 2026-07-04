package com.peaksneaker.repository;

import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

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
}
