package com.peaksneaker.repository.specification;

import com.peaksneaker.entity.User;
import com.peaksneaker.enums.Role;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filterUsers(String query, Boolean isActive, Role role, Instant startDate, Instant endDate) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null && !query.trim().isEmpty()) {
                String searchStr = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(cb.concat(cb.concat(root.get("firstName"), " "), root.get("lastName"))), searchStr);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchStr);
                Predicate phoneMatch = cb.like(root.get("phone"), searchStr);
                predicates.add(cb.or(nameMatch, emailMatch, phoneMatch));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (startDate != null && endDate != null) {
                predicates.add(cb.between(root.get("createdAt"), startDate, endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
