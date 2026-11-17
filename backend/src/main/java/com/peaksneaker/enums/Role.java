package com.peaksneaker.enums;

public enum Role {
    ROLE_SUPER_ADMIN,
    SUPER_ADMIN,
    ROLE_STAFF_MANAGER,
    STAFF_MANAGER,
    ROLE_WAREHOUSE,
    WAREHOUSE,
    ROLE_SALES,
    SALES,
    ROLE_SUPPORT,
    SUPPORT,
    ROLE_MARKETING,
    MARKETING,
    ROLE_ADMIN,
    ADMIN,
    ROLE_CUSTOMER,
    USER;

    public String getAuthorityName() {
        if (this.name().startsWith("ROLE_")) {
            return this.name();
        }
        return "ROLE_" + this.name();
    }

    public boolean isStaffOrAdmin() {
        return this != ROLE_CUSTOMER && this != USER;
    }
}
