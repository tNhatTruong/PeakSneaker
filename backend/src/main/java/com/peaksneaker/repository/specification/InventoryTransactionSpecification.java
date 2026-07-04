package com.peaksneaker.repository.specification;

import com.peaksneaker.entity.InventoryTransaction;
import com.peaksneaker.enums.InventoryTransactionType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class InventoryTransactionSpecification {

    public static Specification<InventoryTransaction> filterTransactions(
            Long productId,
            Long variantId,
            InventoryTransactionType type,
            Instant startDate,
            Instant endDate
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (productId != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("productVariant").get("product").get("id"),
                        productId
                ));
            }

            if (variantId != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("productVariant").get("id"),
                        variantId
                ));
            }

            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
