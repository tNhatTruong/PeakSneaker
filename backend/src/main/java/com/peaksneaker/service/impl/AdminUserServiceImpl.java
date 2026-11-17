package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.UpdateUserRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.entity.Address;
import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.User;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.Role;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.AddressRepository;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.repository.WishlistRepository;
import com.peaksneaker.repository.specification.UserSpecification;
import com.peaksneaker.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final WishlistRepository wishlistRepository;

    @Override
    public PaginatedResponse<UserResponse> getUsers(
            String query, Boolean isActive, Role role, Instant startDate, Instant endDate, int page, int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<User> spec = UserSpecification.filterUsers(query, isActive, role, startDate, endDate);

        Page<User> userPage = userRepository.findAll(spec, pageable);
        Page<UserResponse> responsePage = userPage.map(this::mapToResponse);

        return PaginatedResponse.from(responsePage);
    }

    @Override
    public CustomerDetailResponse getCustomerDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng", "id", id));

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Address> addresses = addressRepository.findByUserId(user.getId());
        int wishlistCount = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();

        int orderCount = orders.size();
        BigDecimal totalSpent = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String tier = resolveTier(totalSpent, orderCount);
        String location = addresses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .or(() -> addresses.stream().findFirst())
                .map(Address::getProvinceName)
                .orElse("Chưa cập nhật");

        List<AddressResponse> addressResponses = addresses.stream()
                .map(AddressResponse::from)
                .collect(Collectors.toList());

        List<OrderResponse> orderResponses = orders.stream()
                .map(o -> OrderResponse.builder()
                        .id(o.getId())
                        .orderCode(o.getOrderCode())
                        .discountAmount(o.getDiscountAmount())
                        .shippingFee(o.getShippingFee())
                        .finalAmount(o.getFinalAmount())
                        .status(o.getStatus())
                        .paymentMethod(o.getPaymentMethod())
                        .paymentStatus(o.getPaymentStatus())
                        .createdAt(o.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return CustomerDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isVerified(user.getIsVerified())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .orderCount(orderCount)
                .totalSpent(totalSpent)
                .averageRating(4.8)
                .wishlistCount(wishlistCount)
                .customerTier(tier)
                .location(location)
                .addresses(addressResponses)
                .recentOrders(orderResponses)
                .build();
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", id));

        if (Boolean.FALSE.equals(isActive) && (user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.SUPER_ADMIN)) {
            throw new BadRequestException("Không thể khóa tài khoản của Quản trị viên tối cao (SUPER_ADMIN).");
        }

        if (isActive) {
            user.activate();
        } else {
            user.block();
        }

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", id));

        if ((user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.SUPER_ADMIN)
                && role != Role.ROLE_SUPER_ADMIN && role != Role.SUPER_ADMIN) {
            throw new BadRequestException("Không thể hạ quyền Quản trị viên tối cao (SUPER_ADMIN).");
        }

        user.setRole(role);
        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserInfo(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", id));

        user.updateProfile(request.getFirstName(), request.getLastName(), request.getPhone());
        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    private UserResponse mapToResponse(User user) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Address> addresses = addressRepository.findByUserId(user.getId());

        int orderCount = orders.size();
        BigDecimal totalSpent = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String tier = resolveTier(totalSpent, orderCount);
        String location = addresses.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .findFirst()
                .or(() -> addresses.stream().findFirst())
                .map(Address::getProvinceName)
                .orElse(null);

        Instant lastOrderDate = orders.isEmpty() ? null : orders.get(0).getCreatedAt();

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .role(user.getRole())
                .isVerified(user.getIsVerified())
                .isActive(user.getIsActive())
                .hasPassword(user.getHasPassword())
                .createdAt(user.getCreatedAt())
                .orderCount(orderCount)
                .totalSpent(totalSpent)
                .customerTier(tier)
                .location(location)
                .lastOrderDate(lastOrderDate)
                .build();
    }

    private String resolveTier(BigDecimal totalSpent, int orderCount) {
        if (totalSpent.compareTo(BigDecimal.valueOf(20_000_000)) >= 0 || orderCount >= 10) {
            return "VIP";
        }
        if (totalSpent.compareTo(BigDecimal.valueOf(5_000_000)) >= 0 || orderCount >= 3) {
            return "LOYAL";
        }
        return "REGULAR";
    }
}
