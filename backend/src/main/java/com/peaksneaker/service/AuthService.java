package com.peaksneaker.service;

import com.peaksneaker.dto.request.LoginRequest;
import com.peaksneaker.dto.request.RegisterRequest;
import com.peaksneaker.dto.response.LoginResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.entity.Cart;
import com.peaksneaker.entity.User;
import com.peaksneaker.enums.Role;
import com.peaksneaker.repository.CartRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.security.JwtUtils;
import com.peaksneaker.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email này đã được sử dụng để đăng ký.");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại này đã được sử dụng để đăng ký.");
        }

        String firstName = request.getFirstName().trim();
        String lastName = request.getLastName().trim();
       

        User user = User.builder()
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(firstName)
                .lastName(lastName)
                .phone(request.getPhone().trim())
                .role(Role.USER)
                .isActive(true)
                .isVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Khởi tạo giỏ hàng trống cho người dùng mới
        Cart cart = Cart.builder()
                .user(savedUser)
                .items(new ArrayList<>())
                .build();
        cartRepository.save(cart);
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản."));

        return LoginResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .fullName(user.getFullname())
                .role(user.getRole())
                .hasPassword(user.getHasPassword())
                .build();
    }


    @Value("${google.client.id}")
    private String googleClientId;

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản."));

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .role(user.getRole())
                .hasPassword(user.getHasPassword())
                .build();
    }

    @Transactional
    public LoginResponse loginWithGoogle(String accessToken) {
        try {
            // Call Google UserInfo API with access_token
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(accessToken);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            org.springframework.http.ResponseEntity<java.util.Map<String, Object>> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {}
            );

            java.util.Map<String, Object> payload = response.getBody();
            if (payload == null || !payload.containsKey("email")) {
                throw new IllegalArgumentException("Token Google không hợp lệ hoặc không có email.");
            }

            String email = (String) payload.get("email");
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                // Tạo tài khoản mới nếu chưa có
                user = User.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Mật khẩu ngẫu nhiên
                        .firstName(firstName != null ? firstName : "User")
                        .lastName(lastName != null ? lastName : "")
                        .phone("")
                        .role(Role.USER)
                        .isActive(true)
                        .isVerified(true) // Google đã xác thực email
                        .hasPassword(false)
                        .build();
                user = userRepository.save(user);

                // Khởi tạo giỏ hàng trống cho người dùng mới
                Cart cart = Cart.builder()
                        .user(user)
                        .items(new ArrayList<>())
                        .build();
                cartRepository.save(cart);
            }

            // Tạo Authentication và Token cho PeakSneaker
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
                    .build();

        } catch (Exception e) {
            throw new IllegalArgumentException("Lỗi xác thực Google: " + e.getMessage());
        }
    }

    @Transactional
    public UserResponse updateMe(Long userId, com.peaksneaker.dto.request.UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        
        user.updateProfile(request.getFirstName(), request.getLastName(), request.getPhone());
        userRepository.save(user);
        
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }
    @Transactional
    public void changePassword(Long userId, com.peaksneaker.dto.request.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }

        if (Boolean.TRUE.equals(user.getHasPassword())) {
            if (request.getOldPassword() == null || request.getOldPassword().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng nhập mật khẩu hiện tại.");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Mật khẩu hiện tại không đúng.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
        userRepository.save(user);
    }
}
