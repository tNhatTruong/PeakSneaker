package com.peaksneaker.repository;

import com.peaksneaker.entity.OrderReturnItem;
import com.peaksneaker.enums.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderReturnItemRepository extends JpaRepository<OrderReturnItem, Long> {

    @Query("""
            select coalesce(sum(item.requestedQuantity), 0)
            from OrderReturnItem item
            where item.orderItem.id = :orderItemId
              and item.orderReturn.status <> :excludedStatus
            """)
    long sumRequestedQuantityByOrderItemExcludingStatus(
            @Param("orderItemId") Long orderItemId,
            @Param("excludedStatus") ReturnStatus excludedStatus
    );
}
