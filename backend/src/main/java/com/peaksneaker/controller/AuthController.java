// File: backend/src/main/java/com/peaksneaker/controller/AuthController.java
package com.peaksneaker.controller;

import com.peaksneaker.dto.request.LoginRequest;
import com.peaksneaker.dto.request.RegisterRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.LoginResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản thành công!", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Người dùng chưa được xác thực.");
        }
        UserResponse response = authService.getMe(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công!", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithGoogle(@Valid @RequestBody com.peaksneaker.dto.request.GoogleLoginRequest request) {
        LoginResponse response = authService.loginWithGoogle(request.getToken());
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập bằng Google thành công!", response));
    }
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody com.peaksneaker.dto.request.UpdateUserRequest request) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Người dùng chưa được xác thực.");
        }
        UserResponse response = authService.updateMe(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công!", response));
    }
    @PostMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody com.peaksneaker.dto.request.ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Người dùng chưa được xác thực.");
        }
        authService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mật khẩu thành công!", null));
    }
}
