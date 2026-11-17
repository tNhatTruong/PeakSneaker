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
                if (role == Role.USER || role == Role.ROLE_CUSTOMER) {
                    predicates.add(root.get("role").in(Role.USER, Role.ROLE_CUSTOMER));
                } else {
                    predicates.add(root.get("role").in(Role.ADMIN, Role.ROLE_ADMIN));
                }
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
