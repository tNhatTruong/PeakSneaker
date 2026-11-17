package com.peaksneaker.service;

import com.peaksneaker.dto.request.UpdateUserRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.enums.Role;

import java.time.Instant;

public interface AdminUserService {
    PaginatedResponse<UserResponse> getUsers(
            String query, Boolean isActive, Role role, Instant startDate, Instant endDate, int page, int size
    );
    UserResponse updateUserStatus(Long id, Boolean isActive);
    UserResponse updateUserRole(Long id, Role role);
    UserResponse updateUserInfo(Long id, UpdateUserRequest request);
    com.peaksneaker.dto.response.CustomerDetailResponse getCustomerDetail(Long id);
}
