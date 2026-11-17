package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponse {
    private Long id; // StaffProfile ID
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String role;
    private String roleName;
    private Integer hierarchyLevel;
    private String department;
    private String departmentName;
    private String positionTitle;
    private String staffStatus;
    private Boolean isActive;
    private Instant joinedAt;
    private Instant createdAt;
    private String notes;
    private List<String> permissions;
}

