package com.peaksneaker.repository;

import com.peaksneaker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByIsActive(Boolean isActive, Pageable pageable);

    Page<User> findByRole(String role, Pageable pageable);

    long countByRole(String role);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.passwordHash = :password")
    User login(@Param("email") String email, @Param("password") String password);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR u.phone LIKE CONCAT('%', :query, '%')")
    Page<User> searchUsers(@Param("query") String query, Pageable pageable);
}