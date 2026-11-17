package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.CreateStaffRequest;
import com.peaksneaker.dto.request.UpdateStaffPermissionsRequest;
import com.peaksneaker.dto.request.UpdateStaffRequest;
import com.peaksneaker.dto.request.UpdateStaffRoleRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/staff")
@RequiredArgsConstructor
public class AdminStaffController {

    private final StaffService staffService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('STAFF_VIEW', 'STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<StaffResponse>>> getStaffList(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "joinedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        String validSortBy;
        if (sortBy == null || sortBy.isBlank()) {
            validSortBy = "joinedAt";
        } else {
            validSortBy = switch (sortBy.toLowerCase()) {
                case "createdat", "joinedat" -> "joinedAt";
                case "department" -> "department";
                case "positiontitle", "position" -> "positionTitle";
                case "staffstatus", "status" -> "staffStatus";
                case "id" -> "id";
                default -> "joinedAt";
            };
        }
        Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(validSortBy).ascending() : Sort.by(validSortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PaginatedResponse<StaffResponse> response = staffService.getStaffList(query, department, status, role, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhân viên thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('STAFF_VIEW', 'STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> getStaffById(@PathVariable Long id) {
        StaffResponse response = staffService.getStaffById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhân viên thành công", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(
            @Valid @RequestBody CreateStaffRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String performedBy = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        StaffResponse response = staffService.createStaff(request, performedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Thêm nhân viên mới thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String performedBy = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        StaffResponse response = staffService.updateStaff(id, request, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhân viên thành công", response));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaffRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String performedBy = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        StaffResponse response = staffService.updateStaffRole(id, request, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò nhân viên thành công", response));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAnyAuthority('STAFF_PERMISSION_ASSIGN', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaffPermissions(
            @PathVariable Long id,
            @RequestBody UpdateStaffPermissionsRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String performedBy = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        StaffResponse response = staffService.updateStaffPermissions(id, request, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền hạn nhân viên thành công", response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaffStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String status = body.getOrDefault("status", "ACTIVE");
        String performedBy = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        StaffResponse response = staffService.updateStaffStatus(id, status, performedBy);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái nhân viên thành công", response));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAnyAuthority('STAFF_VIEW', 'STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> response = staffService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục vai trò thành công", response));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyAuthority('STAFF_VIEW', 'STAFF_MANAGE', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        List<PermissionResponse> response = staffService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục quyền hạn thành công", response));
    }
}
