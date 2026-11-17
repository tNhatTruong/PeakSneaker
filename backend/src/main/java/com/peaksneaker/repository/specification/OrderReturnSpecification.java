package com.peaksneaker.repository.specification;

import com.peaksneaker.dto.request.OrderReturnFilterDto;
import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.OrderItem;
import com.peaksneaker.entity.OrderReturn;
import com.peaksneaker.entity.OrderReturnItem;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

public final class OrderReturnSpecification {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private OrderReturnSpecification() {
    }

    public static Specification<OrderReturn> withFilters(OrderReturnFilterDto filter) {
        return (root, query, criteriaBuilder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            Join<OrderReturn, Order> order = root.join("order", JoinType.INNER);

            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getReasonCode() != null) {
                predicates.add(criteriaBuilder.equal(root.get("reasonCode"), filter.getReasonCode()));
            }
            if (filter.getReturnType() != null) {
                predicates.add(criteriaBuilder.equal(root.get("returnType"), filter.getReturnType()));
            }
            if (filter.getPaymentMethod() != null) {
                predicates.add(criteriaBuilder.equal(order.get("paymentMethod"), filter.getPaymentMethod()));
            }
            if (filter.getOrderId() != null) {
                predicates.add(criteriaBuilder.equal(order.get("id"), filter.getOrderId()));
            }
            if (filter.getFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("createdAt"), filter.getFrom().atStartOfDay(BUSINESS_ZONE).toInstant()));
            }
            if (filter.getTo() != null) {
                predicates.add(criteriaBuilder.lessThan(
                        root.get("createdAt"), filter.getTo().plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant()));
            }

            boolean needsItems = filter.getProductId() != null
                    || (filter.getQuery() != null && !filter.getQuery().isBlank());
            Join<OrderReturn, OrderReturnItem> returnItems = needsItems
                    ? root.join("items", JoinType.LEFT) : null;
            Join<OrderReturnItem, OrderItem> orderItem = returnItems != null
                    ? returnItems.join("orderItem", JoinType.LEFT) : null;

            if (filter.getProductId() != null && orderItem != null) {
                Join<OrderItem, ProductVariant> variant = orderItem.join("productVariant", JoinType.LEFT);
                Join<ProductVariant, Product> product = variant.join("product", JoinType.LEFT);
                predicates.add(criteriaBuilder.equal(product.get("id"), filter.getProductId()));
            }

            if (filter.getQuery() != null && !filter.getQuery().isBlank() && orderItem != null) {
                String normalizedQuery = filter.getQuery().trim().toLowerCase();
                String pattern = "%" + normalizedQuery + "%";
                Join<OrderReturn, User> user = root.join("user", JoinType.LEFT);
                List<Predicate> searchPredicates = new ArrayList<>(List.of(
                        criteriaBuilder.like(criteriaBuilder.lower(order.get("orderCode")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("email")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("firstName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("lastName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(user.get("phone")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(orderItem.get("productName")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(orderItem.get("sku")), pattern)
                ));
                String numericQuery = normalizedQuery.startsWith("rma-")
                        ? normalizedQuery.substring(4) : normalizedQuery;
                if (numericQuery.matches("\\d+")) {
                    try {
                        long numericId = Long.parseLong(numericQuery);
                        searchPredicates.add(criteriaBuilder.equal(root.get("id"), numericId));
                        searchPredicates.add(criteriaBuilder.equal(order.get("id"), numericId));
                    } catch (NumberFormatException ignored) {
                        // A value larger than BIGINT simply cannot match an RMA or order id.
                    }
                }
                predicates.add(criteriaBuilder.or(searchPredicates.toArray(Predicate[]::new)));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
