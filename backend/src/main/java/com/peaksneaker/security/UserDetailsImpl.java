package com.peaksneaker.security;

import com.peaksneaker.entity.User;
import com.peaksneaker.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {

    private Long id;
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    private boolean isActive;

    public static UserDetailsImpl build(User user) {
        String authorityName = user.getRole() != null ? user.getRole().getAuthorityName() : "ROLE_USER";
        Set<String> authNames = new LinkedHashSet<>();
        authNames.add(authorityName);
        if (authorityName.startsWith("ROLE_")) {
            authNames.add(authorityName.substring(5));
        }

        Role role = user.getRole();
        if (role == Role.ROLE_SUPER_ADMIN || role == Role.SUPER_ADMIN) {
            authNames.addAll(List.of(
                    "ROLE_SUPER_ADMIN", "SUPER_ADMIN",
                    "ROLE_ADMIN", "ADMIN",
                    "ROLE_STAFF_MANAGER", "STAFF_MANAGER",
                    "ROLE_WAREHOUSE", "WAREHOUSE",
                    "ROLE_SALES", "SALES",
                    "ROLE_SUPPORT", "SUPPORT",
                    "ROLE_MARKETING", "MARKETING",
                    "ROLE_USER", "USER",
                    "DASHBOARD_VIEW", "DASHBOARD_FINANCIAL", "DASHBOARD_EXPORT",
                    "ORDER_VIEW", "ORDER_CREATE", "ORDER_UPDATE_STATUS", "ORDER_PRINT_WAYBILL", "ORDER_CANCEL", "ORDER_RETURN_MANAGE",
                    "PRODUCT_VIEW", "PRODUCT_CREATE", "PRODUCT_EDIT", "PRODUCT_DELETE",
                    "INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_ADJUST", "INVENTORY_FORECAST",
                    "PROMOTION_VIEW", "PROMOTION_MANAGE",
                    "BRAND_CATEGORY_MANAGE",
                    "CUSTOMER_VIEW", "CUSTOMER_MANAGE",
                    "STAFF_VIEW", "STAFF_MANAGE", "STAFF_PERMISSION_ASSIGN",
                    "AUDIT_LOG_VIEW"
            ));
        } else if (role == Role.ROLE_STAFF_MANAGER || role == Role.STAFF_MANAGER) {
            authNames.addAll(List.of(
                    "ROLE_STAFF_MANAGER", "STAFF_MANAGER",
                    "ROLE_ADMIN", "ADMIN",
                    "ROLE_USER", "USER",
                    "DASHBOARD_VIEW", "STAFF_VIEW", "STAFF_MANAGE", "STAFF_PERMISSION_ASSIGN",
                    "CUSTOMER_VIEW", "CUSTOMER_MANAGE", "AUDIT_LOG_VIEW"
            ));
        } else if (role == Role.ROLE_ADMIN || role == Role.ADMIN) {
            authNames.addAll(List.of(
                    "ROLE_ADMIN", "ADMIN",
                    "ROLE_WAREHOUSE", "WAREHOUSE",
                    "ROLE_SALES", "SALES",
                    "ROLE_SUPPORT", "SUPPORT",
                    "ROLE_MARKETING", "MARKETING",
                    "ROLE_USER", "USER"
            ));
        } else if (role == Role.ROLE_WAREHOUSE || role == Role.WAREHOUSE) {
            authNames.addAll(List.of(
                    "ROLE_WAREHOUSE", "WAREHOUSE",
                    "ROLE_USER", "USER",
                    "INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_ADJUST", "INVENTORY_FORECAST",
                    "PRODUCT_VIEW", "ORDER_VIEW", "ORDER_RETURN_MANAGE"
            ));
        } else if (role == Role.ROLE_SALES || role == Role.SALES) {
            authNames.addAll(List.of(
                    "ROLE_SALES", "SALES",
                    "ROLE_USER", "USER",
                    "ORDER_VIEW", "ORDER_CREATE", "ORDER_UPDATE_STATUS", "CUSTOMER_VIEW"
            ));
        } else if (role == Role.ROLE_SUPPORT || role == Role.SUPPORT) {
            authNames.addAll(List.of(
                    "ROLE_SUPPORT", "SUPPORT",
                    "ROLE_USER", "USER",
                    "ORDER_VIEW", "ORDER_RETURN_MANAGE", "CUSTOMER_VIEW"
            ));
        } else if (role == Role.ROLE_MARKETING || role == Role.MARKETING) {
            authNames.addAll(List.of(
                    "ROLE_MARKETING", "MARKETING",
                    "ROLE_USER", "USER",
                    "PROMOTION_VIEW", "PROMOTION_MANAGE", "PRODUCT_VIEW"
            ));
        }

        List<GrantedAuthority> authorities = authNames.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                authorities,
                user.getIsActive()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}
