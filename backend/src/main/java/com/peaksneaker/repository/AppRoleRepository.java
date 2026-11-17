package com.peaksneaker.repository;

import com.peaksneaker.entity.AppRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppRoleRepository extends JpaRepository<AppRole, Integer> {
    Optional<AppRole> findByCode(String code);
}

