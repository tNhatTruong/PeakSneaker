package com.peaksneaker.repository.specification;

import com.peaksneaker.entity.Brand;
import com.peaksneaker.entity.Category;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.entity.Silhouette;
import com.peaksneaker.enums.AdminProductStatus;
import com.peaksneaker.enums.AdminProductStockStatus;
import com.peaksneaker.enums.Gender;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
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
            String variantSize,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search
    ) {
        return filterProducts(categoryId, brandId, silhouetteId, null, null, variantSize, minPrice, maxPrice, search);
    }

    public static Specification<Product> filterProducts(
            Long categoryId,
            Long brandId,
            Long silhouetteId,
            Gender gender,
            String variantSize,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search
    ) {
        return filterProducts(categoryId, brandId, silhouetteId, gender, null, variantSize, minPrice, maxPrice, search);
    }

    public static Specification<Product> filterProducts(
            Long categoryId,
            Long brandId,
            Long silhouetteId,
            Gender gender,
            Boolean onSale,
            String variantSize,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Chỉ lấy sản phẩm chưa bị xóa
            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            if (Boolean.TRUE.equals(onSale)) {
                predicates.add(criteriaBuilder.greaterThan(root.get("discountPercent"), BigDecimal.ZERO));
            }

            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }

            if (brandId != null) {
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("brand").get("id"), brandId),
                        criteriaBuilder.equal(root.get("silhouette").get("brand").get("id"), brandId)
                ));
            }

            if (silhouetteId != null) {
                predicates.add(criteriaBuilder.equal(root.get("silhouette").get("id"), silhouetteId));
            }

            if (gender != null) {
                if (gender == Gender.MEN) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.equal(root.get("gender"), Gender.MEN),
                            criteriaBuilder.equal(root.get("gender"), Gender.UNISEX)
                    ));
                } else if (gender == Gender.WOMEN) {
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.equal(root.get("gender"), Gender.WOMEN),
                            criteriaBuilder.equal(root.get("gender"), Gender.UNISEX)
                    ));
                } else {
                    predicates.add(criteriaBuilder.equal(root.get("gender"), gender));
                }
            }

            if (StringUtils.hasText(variantSize)) {
                query.distinct(true);
                Join<Product, ProductVariant> variants = root.join("variants", JoinType.INNER);
                predicates.add(criteriaBuilder.equal(variants.get("size"), variantSize));
                predicates.add(criteriaBuilder.greaterThan(variants.get("stockQuantity"), 0));
            }

            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }

            if (StringUtils.hasText(search)) {
                query.distinct(true);
                String[] tokens = search.trim().toLowerCase().split("\\s+");
                Join<Product, Brand> brandJoin = root.join("brand", JoinType.LEFT);
                Join<Product, Silhouette> silhouetteJoin = root.join("silhouette", JoinType.LEFT);
                Join<Product, Category> categoryJoin = root.join("category", JoinType.LEFT);
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.LEFT);

                for (String token : tokens) {
                    if (token.isEmpty()) continue;
                    String pattern = "%" + token + "%";
                    Predicate tokenPredicate = criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(brandJoin.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(silhouetteJoin.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(variantJoin.get("sku")), pattern)
                    );
                    predicates.add(tokenPredicate);
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Admin spec: khong loc isDeleted, bao gom ca san pham da xoa mem.
     */
    public static Specification<Product> filterProductsAdmin(
            String search,
            AdminProductStatus status,
            Long brandId,
            Long categoryId,
            Long silhouetteId,
            AdminProductStockStatus stockStatus,
            BigDecimal minPrice,
            BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                query.distinct(true);
                String[] tokens = search.trim().toLowerCase().split("\\s+");
                Join<Product, Brand> brandJoin = root.join("brand", JoinType.LEFT);
                Join<Product, Silhouette> silhouetteJoin = root.join("silhouette", JoinType.LEFT);
                Join<Product, Category> categoryJoin = root.join("category", JoinType.LEFT);
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.LEFT);

                for (String token : tokens) {
                    if (token.isEmpty()) continue;
                    String pattern = "%" + token + "%";
                    Predicate tokenPredicate = criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(brandJoin.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(silhouetteJoin.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(categoryJoin.get("name")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(variantJoin.get("sku")), pattern)
                    );
                    predicates.add(tokenPredicate);
                }
            }

            if (status == AdminProductStatus.ACTIVE) {
                predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));
            } else if (status == AdminProductStatus.HIDDEN) {
                predicates.add(criteriaBuilder.isTrue(root.get("isDeleted")));
            }

            if (brandId != null) {
                predicates.add(criteriaBuilder.equal(root.get("brand").get("id"), brandId));
            }
            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
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

            if (stockStatus != null) {
                var stockSubquery = query.subquery(Long.class);
                var variantRoot = stockSubquery.from(ProductVariant.class);
                stockSubquery.select(criteriaBuilder.literal(1L));
                List<Predicate> stockPredicates = new ArrayList<>();
                stockPredicates.add(criteriaBuilder.equal(variantRoot.get("product"), root));

                if (stockStatus == AdminProductStockStatus.LOW_STOCK) {
                    stockPredicates.add(criteriaBuilder.between(variantRoot.get("stockQuantity"), 1, 9));
                    stockSubquery.where(stockPredicates.toArray(new Predicate[0]));
                    predicates.add(criteriaBuilder.exists(stockSubquery));
                } else {
                    stockPredicates.add(criteriaBuilder.greaterThan(variantRoot.get("stockQuantity"), 0));
                    stockSubquery.where(stockPredicates.toArray(new Predicate[0]));
                    Predicate hasStock = criteriaBuilder.exists(stockSubquery);
                    predicates.add(stockStatus == AdminProductStockStatus.IN_STOCK
                            ? hasStock
                            : criteriaBuilder.not(hasStock));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
