package com.peaksneaker.service;

import com.peaksneaker.dto.request.CreateStaffRequest;
import com.peaksneaker.dto.request.UpdateStaffPermissionsRequest;
import com.peaksneaker.dto.request.UpdateStaffRequest;
import com.peaksneaker.dto.request.UpdateStaffRoleRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.PermissionResponse;
import com.peaksneaker.dto.response.RoleResponse;
import com.peaksneaker.dto.response.StaffResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StaffService {

    PaginatedResponse<StaffResponse> getStaffList(String query, String department, String status, String role, Pageable pageable);

    StaffResponse getStaffById(Long staffId);

    StaffResponse createStaff(CreateStaffRequest request, String performedBy);

    StaffResponse updateStaff(Long staffId, UpdateStaffRequest request, String performedBy);

    StaffResponse updateStaffRole(Long staffId, UpdateStaffRoleRequest request, String performedBy);

    StaffResponse updateStaffPermissions(Long staffId, UpdateStaffPermissionsRequest request, String performedBy);

    StaffResponse updateStaffStatus(Long staffId, String status, String performedBy);

    List<RoleResponse> getAllRoles();

    List<PermissionResponse> getAllPermissions();
}

