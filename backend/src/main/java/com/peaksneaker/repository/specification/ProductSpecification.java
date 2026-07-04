package com.peaksneaker.repository.specification;

import com.peaksneaker.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filterProducts(
            Long categoryId,
            Long brandId,
            Long silhouetteId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Chỉ lấy sản phẩm chưa bị xóa
            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }

            if (brandId != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("silhouette").get("brand").get("id"),
                        brandId
                ));
            }

            if (silhouetteId != null) {
                predicates.add(criteriaBuilder.equal(root.get("silhouette").get("id"), silhouetteId));
            }

            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                predicates.add(nameLike);
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Admin spec: khong loc isDeleted, bao gom ca san pham da xoa mem.
     */
    public static Specification<Product> filterProductsAdmin(String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

