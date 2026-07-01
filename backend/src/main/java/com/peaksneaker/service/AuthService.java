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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

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
                .build();
    }

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
                .build();
    }
}
