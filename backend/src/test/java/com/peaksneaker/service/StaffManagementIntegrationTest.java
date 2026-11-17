package com.peaksneaker.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import com.peaksneaker.dto.request.UpdateStaffPermissionsRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.PermissionResponse;
import com.peaksneaker.dto.response.RoleResponse;
import com.peaksneaker.dto.response.StaffResponse;

@SpringBootTest
class StaffManagementIntegrationTest {

    @Autowired
    private StaffService staffService;

    @Test
    void getAllRolesReturnsSystemRolesAndHierarchy() {
        List<RoleResponse> roles = staffService.getAllRoles();
        assertThat(roles).isNotEmpty();

        List<String> roleCodes = roles.stream().map(RoleResponse::getCode).toList();
        assertThat(roleCodes).contains(
                "ROLE_SUPER_ADMIN",
                "ROLE_STAFF_MANAGER",
                "ROLE_WAREHOUSE",
                "ROLE_SALES",
                "ROLE_SUPPORT",
                "ROLE_MARKETING"
        );

        // Super Admin must have maximum permissions (26)
        RoleResponse superAdmin = roles.stream()
                .filter(r -> "ROLE_SUPER_ADMIN".equals(r.getCode()))
                .findFirst()
                .orElseThrow();
        assertThat(superAdmin.getHierarchyLevel()).isEqualTo(1);
        assertThat(superAdmin.getPermissions()).hasSize(26);
    }

    @Test
    void getAllPermissionsReturns26FineGrainedPermissionsAcross6Modules() {
        List<PermissionResponse> permissions = staffService.getAllPermissions();
        assertThat(permissions).hasSize(26);

        List<String> modules = permissions.stream().map(PermissionResponse::getModule).distinct().toList();
        assertThat(modules).containsExactlyInAnyOrder(
                "DASHBOARD",
                "ORDER",
                "PRODUCT",
                "INVENTORY",
                "MARKETING",
                "STAFF"
        );

        List<String> codes = permissions.stream().map(PermissionResponse::getCode).toList();
        assertThat(codes).contains(
                "DASHBOARD_VIEW", "DASHBOARD_FINANCIAL",
                "ORDER_VIEW", "ORDER_PRINT_WAYBILL", "ORDER_RETURN_MANAGE",
                "PRODUCT_VIEW", "PRODUCT_CREATE",
                "INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_FORECAST",
                "PROMOTION_VIEW", "PROMOTION_MANAGE",
                "STAFF_VIEW", "STAFF_PERMISSION_ASSIGN", "AUDIT_LOG_VIEW"
        );
    }

    @Test
    void getStaffListFiltersAndPaginatesSuccessfully() {
        PaginatedResponse<StaffResponse> staffPage = staffService.getStaffList(
                null, null, null, null, PageRequest.of(0, 10));

        assertThat(staffPage.getItems()).isNotEmpty();
        StaffResponse firstStaff = staffPage.getItems().getFirst();
        assertThat(firstStaff.getId()).isNotNull();
        assertThat(firstStaff.getEmail()).isNotBlank();
        assertThat(firstStaff.getRole()).isNotBlank();
        assertThat(firstStaff.getStaffStatus()).isIn("ACTIVE", "SUSPENDED", "TERMINATED");
        assertThat(firstStaff.getPermissions()).isNotNull();
    }

    @Test
    @Transactional
    void updateStaffPermissionsCustomizesEffectivePermissions() {
        PaginatedResponse<StaffResponse> staffPage = staffService.getStaffList(
                null, null, null, null, PageRequest.of(0, 5));
        assertThat(staffPage.getItems()).isNotEmpty();

        StaffResponse staff = staffPage.getItems().stream()
                .filter(s -> !"ROLE_SUPER_ADMIN".equals(s.getRole()))
                .findFirst()
                .orElse(staffPage.getItems().getFirst());

        UpdateStaffPermissionsRequest request = new UpdateStaffPermissionsRequest();
        request.setPermissions(List.of("DASHBOARD_VIEW", "ORDER_VIEW", "ORDER_PRINT_WAYBILL"));

        StaffResponse updated = staffService.updateStaffPermissions(staff.getId(), request, "TEST_RUNNER");
        assertThat(updated.getPermissions()).contains("DASHBOARD_VIEW", "ORDER_VIEW", "ORDER_PRINT_WAYBILL");
    }

    @Test
    @Transactional
    void updateStaffStatusCanSuspendAndReactivate() {
        PaginatedResponse<StaffResponse> staffPage = staffService.getStaffList(
                null, null, null, null, PageRequest.of(0, 5));
        assertThat(staffPage.getItems()).isNotEmpty();

        StaffResponse staff = staffPage.getItems().stream()
                .filter(s -> !"ROLE_SUPER_ADMIN".equals(s.getRole()))
                .findFirst()
                .orElse(staffPage.getItems().getFirst());

        StaffResponse suspended = staffService.updateStaffStatus(staff.getId(), "SUSPENDED", "TEST_RUNNER");
        assertThat(suspended.getStaffStatus()).isEqualTo("SUSPENDED");
        assertThat(suspended.getIsActive()).isFalse();

        StaffResponse restored = staffService.updateStaffStatus(staff.getId(), "ACTIVE", "TEST_RUNNER");
        assertThat(restored.getStaffStatus()).isEqualTo("ACTIVE");
        assertThat(restored.getIsActive()).isTrue();
    }
}

