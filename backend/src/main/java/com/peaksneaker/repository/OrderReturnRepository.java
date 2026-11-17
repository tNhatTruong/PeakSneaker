package com.peaksneaker.repository;

import com.peaksneaker.entity.OrderReturn;
import com.peaksneaker.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderReturnRepository extends JpaRepository<OrderReturn, Long>, JpaSpecificationExecutor<OrderReturn> {
    List<OrderReturn> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<OrderReturn> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<OrderReturn> findByOrderId(Long orderId);
    Page<OrderReturn> findByOrderIdOrderByCreatedAtDesc(Long orderId, Pageable pageable);
    Optional<OrderReturn> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);
    Page<OrderReturn> findByStatusOrderByCreatedAtDesc(ReturnStatus status, Pageable pageable);
    long countByStatus(ReturnStatus status);

    @Query("""
            select distinct p.id, p.name
            from OrderReturn r
            join r.items ri
            join ri.orderItem oi
            join oi.productVariant pv
            join pv.product p
            order by p.name
            """)
    List<Object[]> findReturnProductOptions();

    @Query("""
            select distinct r from OrderReturn r
            join fetch r.items ri
            join fetch ri.orderItem oi
            where oi.productVariant.id = :variantId
            order by r.createdAt desc
            """)
    List<OrderReturn> findByProductVariantId(@Param("variantId") Long variantId);
}
