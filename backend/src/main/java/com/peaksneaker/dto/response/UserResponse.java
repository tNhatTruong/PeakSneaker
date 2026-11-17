package com.peaksneaker.dto.response;

import com.peaksneaker.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private Role role;
    private Boolean isVerified;
    private Boolean isActive;
    private Boolean hasPassword;
    private java.time.Instant createdAt;
    private Integer orderCount;
    private java.math.BigDecimal totalSpent;
    private String customerTier; // VIP, LOYAL, REGULAR
    private String location;
    private java.time.Instant lastOrderDate;
    private java.util.List<String> permissions;
}
