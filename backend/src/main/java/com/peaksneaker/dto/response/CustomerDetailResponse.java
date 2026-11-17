package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDetailResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private Boolean isVerified;
    private Boolean isActive;
    private Instant createdAt;
    
    // Stats
    private Integer orderCount;
    private BigDecimal totalSpent;
    private Double averageRating;
    private Integer wishlistCount;
    private String customerTier; // VIP, LOYAL, REGULAR
    private String location;

    // Sub-data
    private List<AddressResponse> addresses;
    private List<OrderResponse> recentOrders;
}

