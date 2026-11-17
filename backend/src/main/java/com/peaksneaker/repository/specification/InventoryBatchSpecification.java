package com.peaksneaker.repository.specification;

import com.peaksneaker.entity.InventoryBatch;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class InventoryBatchSpecification {

    private InventoryBatchSpecification() {
    }

    public static Specification<InventoryBatch> withFilters(String search, Long variantId, Boolean isQuarantined) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Join<InventoryBatch, ProductVariant> variantJoin = root.join("variant", JoinType.LEFT);
            Join<ProductVariant, Product> productJoin = variantJoin.join("product", JoinType.LEFT);

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate batchCodeMatch = cb.like(cb.lower(root.get("batchCode")), pattern);
                Predicate supplierMatch = cb.like(cb.lower(root.get("supplierName")), pattern);
                Predicate poMatch = cb.like(cb.lower(root.get("poNumber")), pattern);
                Predicate invoiceMatch = cb.like(cb.lower(root.get("invoiceNumber")), pattern);
                Predicate skuMatch = cb.like(cb.lower(variantJoin.get("sku")), pattern);
                Predicate productNameMatch = cb.like(cb.lower(productJoin.get("name")), pattern);

                predicates.add(cb.or(batchCodeMatch, supplierMatch, poMatch, invoiceMatch, skuMatch, productNameMatch));
            }

            if (variantId != null) {
                predicates.add(cb.equal(variantJoin.get("id"), variantId));
            }

            if (isQuarantined != null) {
                predicates.add(cb.equal(root.get("isQuarantined"), isQuarantined));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

