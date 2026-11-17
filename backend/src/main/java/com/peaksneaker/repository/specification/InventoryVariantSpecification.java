package com.peaksneaker.repository.specification;

import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.InventoryStockStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class InventoryVariantSpecification {

    private InventoryVariantSpecification() {
    }

    public static Specification<ProductVariant> filter(
            String search,
            Long productId,
            Long brandId,
            Long categoryId,
            Long silhouetteId,
            InventoryStockStatus stockStatus) {
        return (root, query, criteriaBuilder) -> {
            Join<ProductVariant, Product> product = root.join("product", JoinType.INNER);
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(product.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(product.join("brand", JoinType.LEFT).get("name")), pattern)
                ));
            }
            if (productId != null) {
                predicates.add(criteriaBuilder.equal(product.get("id"), productId));
            }
            if (brandId != null) {
                predicates.add(criteriaBuilder.equal(product.get("brand").get("id"), brandId));
            }
            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(product.get("category").get("id"), categoryId));
            }
            if (silhouetteId != null) {
                predicates.add(criteriaBuilder.equal(product.get("silhouette").get("id"), silhouetteId));
            }

            if (stockStatus != null) {
                switch (stockStatus) {
                    case INACTIVE -> predicates.add(criteriaBuilder.isTrue(product.get("isDeleted")));
                    case OUT_OF_STOCK -> {
                        predicates.add(criteriaBuilder.isFalse(product.get("isDeleted")));
                        predicates.add(criteriaBuilder.equal(root.get("stockQuantity"), 0));
                    }
                    case LOW_STOCK -> {
                        predicates.add(criteriaBuilder.isFalse(product.get("isDeleted")));
                        predicates.add(criteriaBuilder.greaterThan(root.get("stockQuantity"), 0));
                        predicates.add(criteriaBuilder.lessThanOrEqualTo(
                                root.get("stockQuantity"), root.get("safetyStockThreshold")));
                    }
                    case IN_STOCK -> {
                        predicates.add(criteriaBuilder.isFalse(product.get("isDeleted")));
                        predicates.add(criteriaBuilder.greaterThan(
                                root.get("stockQuantity"), root.get("safetyStockThreshold")));
                    }
                }
            }

            query.distinct(true);
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
