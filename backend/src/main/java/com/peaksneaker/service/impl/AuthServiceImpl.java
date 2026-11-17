package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.*;
import com.peaksneaker.dto.response.LoginResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.entity.Cart;
import com.peaksneaker.entity.User;
import com.peaksneaker.entity.UserPermission;
import com.peaksneaker.enums.Role;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ConflictException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.CartRepository;
import com.peaksneaker.repository.UserPermissionRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.security.JwtUtils;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.AuthService;
import com.peaksneaker.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    // Cache lưu trữ mã OTP trong bộ nhớ với thời hạn 5 phút
    private static final Map<String, TokenEntry> OTP_CACHE = new ConcurrentHashMap<>();
    private static final Map<String, TokenEntry> RESET_PASSWORD_CACHE = new ConcurrentHashMap<>();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_CACHE_ENTRIES = 10_000;

    private record TokenEntry(String code, Instant expiresAt, int attempts) {}

    private static void evictExpiredTokens(Map<String, TokenEntry> cache) {
        Instant now = Instant.now();
        cache.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        if (cache.size() >= MAX_CACHE_ENTRIES) {
            cache.clear();
        }
    }

    private List<String> resolveEffectivePermissions(User user) {
        List<String> granted = new ArrayList<>();
        List<String> revoked = new ArrayList<>();
        if (userPermissionRepository != null && user.getId() != null) {
            for (UserPermission up : userPermissionRepository.findByUserId(user.getId())) {
                if (up.getPermission() == null || up.getPermission().getCode() == null) continue;
                if (Boolean.TRUE.equals(up.getIsGranted())) {
                    granted.add(up.getPermission().getCode());
                } else {
                    revoked.add(up.getPermission().getCode());
                }
            }
        }
        UserDetailsImpl details = UserDetailsImpl.build(user, granted, revoked);
        return details.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .sorted()
                .toList();
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new ConflictException("Email này đã được sử dụng để đăng ký.");
        }
        if (userRepository.existsByPhone(request.getPhone().trim())) {
            throw new ConflictException("Số điện thoại này đã được sử dụng để đăng ký.");
        }

        String firstName = request.getFirstName().trim();
        String lastName = request.getLastName().trim();

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(firstName)
                .lastName(lastName)
                .phone(request.getPhone().trim())
                .role(Role.USER)
                .isActive(true)
                .isVerified(false)
                .hasPassword(true)
                .build();

        User savedUser = userRepository.save(user);

        // Khởi tạo giỏ hàng trống cho người dùng mới
        Cart cart = Cart.builder()
                .user(savedUser)
                .items(new ArrayList<>())
                .build();
        cartRepository.save(cart);

        // Tạo mã OTP 6 chữ số
        evictExpiredTokens(OTP_CACHE);
        String otpCode = String.format("%06d", RANDOM.nextInt(1000000));
        OTP_CACHE.put(savedUser.getEmail(), new TokenEntry(otpCode, Instant.now().plusSeconds(300), 0));

        // Gửi email OTP
        try {
            emailService.sendOtpEmail(savedUser.getEmail(), otpCode, savedUser.getFirstName());
        } catch (Exception e) {
            log.warn("Lỗi gửi OTP email kích hoạt tài khoản: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        TokenEntry entry = OTP_CACHE.get(email);

        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            OTP_CACHE.remove(email);
            throw new BadRequestException("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới.");
        }

        if (!entry.code().equals(request.getOtpCode().trim())) {
            int nextAttempts = entry.attempts() + 1;
            if (nextAttempts >= 5) {
                OTP_CACHE.remove(email);
                throw new BadRequestException("Bạn đã nhập sai mã OTP quá 5 lần. Mã OTP đã bị hủy vì lý do bảo mật. Vui lòng yêu cầu gửi lại mã mới.");
            }
            OTP_CACHE.put(email, new TokenEntry(entry.code(), entry.expiresAt(), nextAttempts));
            throw new BadRequestException("Mã OTP không chính xác. Bạn còn " + (5 - nextAttempts) + " lần thử.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "email", email));

        user.setIsVerified(true);
        userRepository.save(user);
        OTP_CACHE.remove(email);
    }

    @Override
    public void resendOtp(String email) {
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "email", cleanEmail));

        evictExpiredTokens(OTP_CACHE);
        String otpCode = String.format("%06d", RANDOM.nextInt(1000000));
        OTP_CACHE.put(cleanEmail, new TokenEntry(otpCode, Instant.now().plusSeconds(300), 0));

        emailService.sendOtpEmail(cleanEmail, otpCode, user.getFirstName());
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userDetails.getId()));

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new BadRequestException("Tài khoản chưa được xác thực mã OTP. Vui lòng kiểm tra email để kích hoạt tài khoản.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        return LoginResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .fullName(user.getFullname())
                .role(user.getRole())
                .hasPassword(user.getHasPassword())
                .permissions(resolveEffectivePermissions(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .role(user.getRole())
                .hasPassword(user.getHasPassword())
                .permissions(resolveEffectivePermissions(user))
                .build();
    }

    @Override
    @Transactional
    public LoginResponse loginWithGoogle(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> payload = response.getBody();
            if (payload == null || !payload.containsKey("email")) {
                throw new BadRequestException("Token Google không hợp lệ hoặc không có email.");
            }

            String email = ((String) payload.get("email")).toLowerCase();
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                user = User.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .firstName(firstName != null ? firstName : "User")
                        .lastName(lastName != null ? lastName : "")
                        .phone(null)
                        .role(Role.USER)
                        .isActive(true)
                        .isVerified(true)
                        .hasPassword(false)
                        .build();
                user = userRepository.save(user);

                Cart cart = Cart.builder()
                        .user(user)
                        .items(new ArrayList<>())
                        .build();
                cartRepository.save(cart);
            } else {
                if (Boolean.FALSE.equals(user.getIsActive())) {
                    throw new BadRequestException("Tài khoản đã bị tạm khóa hoặc ngừng hoạt động.");
                }
                if (Boolean.FALSE.equals(user.getIsVerified())) {
                    user.setIsVerified(true);
                    user = userRepository.save(user);
                }
            }

            UserDetails userDetails = UserDetailsImpl.build(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            return LoginResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .fullName(user.getFullname())
                .role(user.getRole())
                .hasPassword(user.getHasPassword())
                .permissions(resolveEffectivePermissions(user))
                .build();

        } catch (Exception e) {
            throw new BadRequestException("Lỗi xác thực Google: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public UserResponse updateMe(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
        
        user.updateProfile(request.getFirstName(), request.getLastName(), request.getPhone());
        userRepository.save(user);
        
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .role(user.getRole())
                .hasPassword(user.getHasPassword())
                .permissions(resolveEffectivePermissions(user))
                .build();
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.");
        }

        if (Boolean.TRUE.equals(user.getHasPassword())) {
            if (request.getOldPassword() == null || request.getOldPassword().isEmpty()) {
                throw new BadRequestException("Vui lòng nhập mật khẩu hiện tại.");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Mật khẩu hiện tại không đúng.");
            }
            if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
        userRepository.save(user);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "email", email));

        evictExpiredTokens(RESET_PASSWORD_CACHE);
        String resetToken = String.format("%06d", RANDOM.nextInt(1000000));
        RESET_PASSWORD_CACHE.put(email, new TokenEntry(resetToken, Instant.now().plusSeconds(600), 0));

        emailService.sendPasswordResetEmail(email, resetToken, user.getFirstName());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        TokenEntry entry = RESET_PASSWORD_CACHE.get(email);

        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            RESET_PASSWORD_CACHE.remove(email);
            throw new BadRequestException("Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng gửi lại yêu cầu.");
        }

        if (!entry.code().equals(request.getToken().trim())) {
            int nextAttempts = entry.attempts() + 1;
            if (nextAttempts >= 5) {
                RESET_PASSWORD_CACHE.remove(email);
                throw new BadRequestException("Bạn đã nhập sai mã xác thực quá 5 lần. Yêu cầu đặt lại mật khẩu đã bị hủy vì lý do bảo mật. Vui lòng thực hiện lại.");
            }
            RESET_PASSWORD_CACHE.put(email, new TokenEntry(entry.code(), entry.expiresAt(), nextAttempts));
            throw new BadRequestException("Mã xác thực không chính xác. Bạn còn " + (5 - nextAttempts) + " lần thử.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "email", email));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
        userRepository.save(user);
        RESET_PASSWORD_CACHE.remove(email);
    }
}
