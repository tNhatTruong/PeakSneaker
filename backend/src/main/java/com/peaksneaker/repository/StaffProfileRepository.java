package com.peaksneaker.repository;

import com.peaksneaker.entity.StaffProfile;
import com.peaksneaker.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long>, JpaSpecificationExecutor<StaffProfile> {
    Optional<StaffProfile> findByUserId(Long userId);

    @Query(value = "SELECT sp FROM StaffProfile sp JOIN FETCH sp.user u WHERE " +
           "(:department IS NULL OR sp.department = :department) AND " +
           "(:status IS NULL OR sp.staffStatus = :status) AND " +
           "(:role IS NULL OR u.role = :role)",
           countQuery = "SELECT COUNT(sp) FROM StaffProfile sp JOIN sp.user u WHERE " +
           "(:department IS NULL OR sp.department = :department) AND " +
           "(:status IS NULL OR sp.staffStatus = :status) AND " +
           "(:role IS NULL OR u.role = :role)")
    Page<StaffProfile> findStaffWithoutQuery(
            @Param("department") String department,
            @Param("status") String status,
            @Param("role") Role role,
            Pageable pageable
    );

    @Query(value = "SELECT sp FROM StaffProfile sp JOIN FETCH sp.user u WHERE " +
           "(LOWER(u.firstName) LIKE :queryPattern OR " +
           "LOWER(u.lastName) LIKE :queryPattern OR " +
           "LOWER(u.email) LIKE :queryPattern OR " +
           "LOWER(sp.positionTitle) LIKE :queryPattern) AND " +
           "(:department IS NULL OR sp.department = :department) AND " +
           "(:status IS NULL OR sp.staffStatus = :status) AND " +
           "(:role IS NULL OR u.role = :role)",
           countQuery = "SELECT COUNT(sp) FROM StaffProfile sp JOIN sp.user u WHERE " +
           "(LOWER(u.firstName) LIKE :queryPattern OR " +
           "LOWER(u.lastName) LIKE :queryPattern OR " +
           "LOWER(u.email) LIKE :queryPattern OR " +
           "LOWER(sp.positionTitle) LIKE :queryPattern) AND " +
           "(:department IS NULL OR sp.department = :department) AND " +
           "(:status IS NULL OR sp.staffStatus = :status) AND " +
           "(:role IS NULL OR u.role = :role)")
    Page<StaffProfile> findStaffWithQuery(
            @Param("queryPattern") String queryPattern,
            @Param("department") String department,
            @Param("status") String status,
            @Param("role") Role role,
            Pageable pageable
    );
}

