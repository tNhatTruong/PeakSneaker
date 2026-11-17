package com.peaksneaker.repository;

import com.peaksneaker.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UserPermission.UserPermissionId> {
    List<UserPermission> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}

