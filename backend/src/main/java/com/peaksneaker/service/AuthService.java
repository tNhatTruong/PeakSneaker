package com.peaksneaker.service;

import com.peaksneaker.dto.request.*;
import com.peaksneaker.dto.response.LoginResponse;
import com.peaksneaker.dto.response.UserResponse;

public interface AuthService {
    void register(RegisterRequest request);
    void verifyOtp(VerifyOtpRequest request);
    void resendOtp(String email);
    LoginResponse login(LoginRequest request);
    UserResponse getMe(Long userId);
    LoginResponse loginWithGoogle(String accessToken);
    UserResponse updateMe(Long userId, UpdateUserRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
