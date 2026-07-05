package com.peaksneaker.controller;

import com.peaksneaker.dto.request.UpdateUserRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.enums.Role;
import com.peaksneaker.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String specificMonth, // format yyyy-MM
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Instant startDate = null;
        Instant endDate = null;
        ZoneId zone = ZoneId.systemDefault();

        if (specificMonth != null && !specificMonth.trim().isEmpty()) {
            try {
                YearMonth yearMonth = YearMonth.parse(specificMonth, DateTimeFormatter.ofPattern("yyyy-MM"));
                startDate = yearMonth.atDay(1).atStartOfDay(zone).toInstant();
                endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(zone).toInstant();
            } catch (Exception e) {
                // Ignore invalid format
            }
        }

        PaginatedResponse<UserResponse> response = adminUserService.getUsers(query, isActive, role, startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive) {
        UserResponse response = adminUserService.updateUserStatus(id, isActive);
        String msg = isActive ? "Đã mở khóa tài khoản thành công" : "Đã khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @RequestParam Role role) {
        UserResponse response = adminUserService.updateUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quyền hạn thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserInfo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = adminUserService.updateUserInfo(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", response));
    }
}
