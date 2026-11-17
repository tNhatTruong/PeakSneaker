package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.UpdateUserRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.CustomerDetailResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.enums.Role;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String specificMonth, // format yyyy-MM
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate resolvedFrom = from;
        LocalDate resolvedTo = to;

        if (resolvedFrom == null && resolvedTo == null && specificMonth != null && !specificMonth.isBlank()) {
            try {
                YearMonth yearMonth = YearMonth.parse(specificMonth, DateTimeFormatter.ofPattern("yyyy-MM"));
                resolvedFrom = yearMonth.atDay(1);
                resolvedTo = yearMonth.atEndOfMonth();
            } catch (DateTimeParseException exception) {
                throw new BadRequestException("Tháng tham gia phải có định dạng yyyy-MM.");
            }
        }

        if (resolvedFrom != null && resolvedTo != null && resolvedFrom.isAfter(resolvedTo)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc.");
        }

        Instant startDate = resolvedFrom != null ? resolvedFrom.atStartOfDay(zone).toInstant() : null;
        Instant endDate = resolvedTo != null
                ? resolvedTo.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1)
                : null;

        PaginatedResponse<UserResponse> response = adminUserService.getUsers(query, isActive, role, startDate, endDate, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", response));
    }

    @GetMapping("/{id}/customer-detail")
    public ResponseEntity<ApiResponse<CustomerDetailResponse>> getCustomerDetail(@PathVariable Long id) {
        CustomerDetailResponse response = adminUserService.getCustomerDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết khách hàng thành công", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive) {
        UserResponse response = adminUserService.updateUserStatus(id, isActive);
        String msg = isActive ? "Đã mở khóa tài khoản thành công" : "Đã khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'SUPER_ADMIN')")
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
