package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.CreateStaffRequest;
import com.peaksneaker.dto.request.UpdateStaffPermissionsRequest;
import com.peaksneaker.dto.request.UpdateStaffRequest;
import com.peaksneaker.dto.request.UpdateStaffRoleRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.PermissionResponse;
import com.peaksneaker.dto.response.RoleResponse;
import com.peaksneaker.dto.response.StaffResponse;
import com.peaksneaker.entity.AppRole;
import com.peaksneaker.entity.Permission;
import com.peaksneaker.entity.StaffProfile;
import com.peaksneaker.entity.User;
import com.peaksneaker.entity.UserPermission;
import com.peaksneaker.enums.Role;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ConflictException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.AppRoleRepository;
import com.peaksneaker.repository.PermissionRepository;
import com.peaksneaker.repository.StaffProfileRepository;
import com.peaksneaker.repository.UserPermissionRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffServiceImpl implements StaffService {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final AppRoleRepository appRoleRepository;
    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PaginatedResponse<StaffResponse> getStaffList(
            String query, String department, String status, String role, Pageable pageable
    ) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanDept = (department != null && !"Tất cả".equalsIgnoreCase(department) && !department.trim().isEmpty()) ? department.trim() : null;
        String cleanStatus = (status != null && !"Tất cả".equalsIgnoreCase(status) && !status.trim().isEmpty()) ? status.trim() : null;
        
        Role roleEnum = null;
        if (role != null && !"Tất cả".equalsIgnoreCase(role) && !role.trim().isEmpty()) {
            try {
                roleEnum = Role.valueOf(role.trim());
            } catch (IllegalArgumentException ignored) {}
        }

        Page<StaffProfile> profilePage;
        if (cleanQuery == null) {
            profilePage = staffProfileRepository.findStaffWithoutQuery(cleanDept, cleanStatus, roleEnum, pageable);
        } else {
            String queryPattern = "%" + cleanQuery.toLowerCase() + "%";
            profilePage = staffProfileRepository.findStaffWithQuery(queryPattern, cleanDept, cleanStatus, roleEnum, pageable);
        }

        Page<StaffResponse> responsePage = profilePage.map(this::mapToStaffResponse);
        return PaginatedResponse.from(responsePage);
    }

    @Override
    public StaffResponse getStaffById(Long staffId) {
        StaffProfile profile = staffProfileRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", staffId));
        return mapToStaffResponse(profile);
    }

    @Override
    @Transactional
    public StaffResponse createStaff(CreateStaffRequest request, String performedBy) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new ConflictException("Email '" + request.getEmail() + "' đã tồn tại trong hệ thống.");
        }

        if (request.getPhone() != null && !request.getPhone().trim().isEmpty() && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new ConflictException("Số điện thoại '" + request.getPhone() + "' đã được sử dụng.");
        }

        Role roleEnum;
        try {
            roleEnum = Role.valueOf(request.getRole().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Vai trò không hợp lệ: " + request.getRole());
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(roleEnum)
                .isActive(true)
                .isVerified(true)
                .build();
        User savedUser = userRepository.save(user);

        StaffProfile profile = StaffProfile.builder()
                .user(savedUser)
                .department(request.getDepartment().trim())
                .positionTitle(request.getPositionTitle().trim())
                .staffStatus("ACTIVE")
                .notes(request.getNotes())
                .build();
        StaffProfile savedProfile = staffProfileRepository.save(profile);

        if (request.getCustomPermissions() != null && !request.getCustomPermissions().isEmpty()) {
            saveCustomPermissions(savedUser, request.getCustomPermissions());
        }

        return mapToStaffResponse(savedProfile);
    }

    @Override
    @Transactional
    public StaffResponse updateStaff(Long staffId, UpdateStaffRequest request, String performedBy) {
        StaffProfile profile = staffProfileRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", staffId));

        User user = profile.getUser();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        }
        userRepository.save(user);

        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
            profile.setDepartment(request.getDepartment().trim());
        }
        if (request.getPositionTitle() != null && !request.getPositionTitle().trim().isEmpty()) {
            profile.setPositionTitle(request.getPositionTitle().trim());
        }
        if (request.getNotes() != null) {
            profile.setNotes(request.getNotes().trim());
        }
        StaffProfile savedProfile = staffProfileRepository.save(profile);

        return mapToStaffResponse(savedProfile);
    }

    @Override
    @Transactional
    public StaffResponse updateStaffRole(Long staffId, UpdateStaffRoleRequest request, String performedBy) {
        StaffProfile profile = staffProfileRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", staffId));

        Role newRole;
        try {
            newRole = Role.valueOf(request.getRole().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Vai trò không hợp lệ: " + request.getRole());
        }

        User user = profile.getUser();

        // 1. Super Admin Inviolability: Không ai được phép sửa vai trò của Super Admin
        if (user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Không thể thay đổi vai trò của Quản trị viên tối cao (SUPER_ADMIN).");
        }

        // 2. Chống tự thay đổi vai trò của chính mình
        if (user.getEmail().equalsIgnoreCase(performedBy)) {
            throw new BadRequestException("Không thể tự thay đổi vai trò của chính mình.");
        }

        // 3. Chỉ Super Admin mới có quyền phong ai đó lên SUPER_ADMIN
        if (newRole == Role.ROLE_SUPER_ADMIN || newRole == Role.SUPER_ADMIN) {
            User actor = userRepository.findByEmail(performedBy).orElse(null);
            if (actor == null || (actor.getRole() != Role.ROLE_SUPER_ADMIN && actor.getRole() != Role.SUPER_ADMIN)) {
                throw new BadRequestException("Chỉ Quản trị viên tối cao mới có quyền gán vai trò SUPER_ADMIN.");
            }
        }

        user.setRole(newRole);
        userRepository.save(user);

        // Reset user custom permissions to inherit role defaults
        userPermissionRepository.deleteByUserId(user.getId());

        return mapToStaffResponse(profile);
    }

    @Override
    @Transactional
    public StaffResponse updateStaffPermissions(Long staffId, UpdateStaffPermissionsRequest request, String performedBy) {
        StaffProfile profile = staffProfileRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", staffId));

        User user = profile.getUser();

        // Không ai được phép can thiệp quyền của Super Admin
        if (user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Không thể thay đổi quyền hạn của Quản trị viên tối cao (SUPER_ADMIN).");
        }

        userPermissionRepository.deleteByUserId(user.getId());

        if (request.getPermissions() != null) {
            saveCustomPermissions(user, request.getPermissions());
        }

        return mapToStaffResponse(profile);
    }

    @Override
    @Transactional
    public StaffResponse updateStaffStatus(Long staffId, String status, String performedBy) {
        StaffProfile profile = staffProfileRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên", "id", staffId));

        String upperStatus = status.trim().toUpperCase();
        if (!List.of("ACTIVE", "SUSPENDED", "TERMINATED").contains(upperStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + status);
        }

        User user = profile.getUser();

        // Không được phép khóa hoặc sa thải Super Admin
        if (user.getRole() == Role.ROLE_SUPER_ADMIN || user.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Không thể khóa hoặc chấm dứt tài khoản của Quản trị viên tối cao (SUPER_ADMIN).");
        }

        // Không được phép tự khóa chính mình
        if (user.getEmail().equalsIgnoreCase(performedBy)) {
            throw new BadRequestException("Không thể tự khóa hoặc chấm dứt tài khoản của chính mình.");
        }

        profile.setStaffStatus(upperStatus);
        StaffProfile savedProfile = staffProfileRepository.save(profile);

        user.setIsActive("ACTIVE".equals(upperStatus));
        userRepository.save(user);

        return mapToStaffResponse(savedProfile);
    }

    @Override
    public List<RoleResponse> getAllRoles() {
        return appRoleRepository.findAll().stream().map(role -> RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .hierarchyLevel(role.getHierarchyLevel())
                .description(role.getDescription())
                .isSystem(role.getIsSystem())
                .permissions(role.getPermissions().stream().map(Permission::getCode).sorted().collect(Collectors.toList()))
                .build()).collect(Collectors.toList());
    }

    @Override
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAllByOrderByModuleAscCodeAsc().stream()
                .map(p -> PermissionResponse.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .name(p.getName())
                        .module(p.getModule())
                        .description(p.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    private void saveCustomPermissions(User user, List<String> permissionCodes) {
        for (String code : permissionCodes) {
            permissionRepository.findByCode(code.trim()).ifPresent(p -> {
                UserPermission up = UserPermission.builder()
                        .id(new UserPermission.UserPermissionId(user.getId(), p.getId()))
                        .user(user)
                        .permission(p)
                        .isGranted(true)
                        .build();
                userPermissionRepository.save(up);
            });
        }
    }

    private StaffResponse mapToStaffResponse(StaffProfile profile) {
        User user = profile.getUser();
        String roleStr = user.getRole() != null ? user.getRole().name() : "ROLE_WAREHOUSE";

        // Collect effective permissions: Role permissions + User granted permissions
        Set<String> effectivePermissions = new HashSet<>();
        appRoleRepository.findByCode(roleStr).ifPresent(r -> {
            r.getPermissions().forEach(p -> effectivePermissions.add(p.getCode()));
        });

        List<UserPermission> userPerms = userPermissionRepository.findByUserId(user.getId());
        for (UserPermission up : userPerms) {
            if (Boolean.TRUE.equals(up.getIsGranted())) {
                effectivePermissions.add(up.getPermission().getCode());
            } else {
                effectivePermissions.remove(up.getPermission().getCode());
            }
        }

        String roleName = mapRoleToVietnamese(roleStr);
        String deptName = mapDepartmentToVietnamese(profile.getDepartment());
        int hierarchy = getHierarchyForRole(roleStr);

        return StaffResponse.builder()
                .id(profile.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullname())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(roleStr)
                .roleName(roleName)
                .hierarchyLevel(hierarchy)
                .department(profile.getDepartment())
                .departmentName(deptName)
                .positionTitle(profile.getPositionTitle())
                .staffStatus(profile.getStaffStatus())
                .isActive(user.getIsActive())
                .joinedAt(profile.getJoinedAt())
                .createdAt(user.getCreatedAt())
                .notes(profile.getNotes())
                .permissions(effectivePermissions.stream().sorted().collect(Collectors.toList()))
                .build();
    }

    private String mapRoleToVietnamese(String role) {
        return switch (role) {
            case "ROLE_SUPER_ADMIN", "SUPER_ADMIN" -> "Quản trị viên";
            case "ROLE_STAFF_MANAGER", "STAFF_MANAGER" -> "Quản lý nhân sự";
            case "ROLE_WAREHOUSE", "WAREHOUSE" -> "Quản lý kho";
            case "ROLE_SALES", "SALES" -> "Nhân viên bán hàng";
            case "ROLE_SUPPORT", "SUPPORT" -> "Nhân viên CSKH";
            case "ROLE_MARKETING", "MARKETING" -> "Nhân viên nội dung";
            default -> "Nhân viên";
        };
    }

    private String mapDepartmentToVietnamese(String dept) {
        if (dept == null) return "Chưa phân ban";
        return switch (dept) {
            case "BAN_GIAM_DOC" -> "Ban giám đốc";
            case "KHO_VAN" -> "Kho vận";
            case "BAN_HANG" -> "Bán hàng";
            case "CSKH" -> "Chăm sóc khách hàng";
            case "MARKETING" -> "Marketing";
            case "TAI_CHINH" -> "Tài chính";
            default -> dept;
        };
    }

    private int getHierarchyForRole(String role) {
        return switch (role) {
            case "ROLE_SUPER_ADMIN", "SUPER_ADMIN" -> 1;
            case "ROLE_STAFF_MANAGER", "STAFF_MANAGER" -> 2;
            default -> 3;
        };
    }
}

