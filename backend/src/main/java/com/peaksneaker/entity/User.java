package com.peaksneaker.entity;

import com.peaksneaker.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private Role role = Role.USER; //USER ,ADMIN

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Cart cart;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private java.util.List<Address> addresses = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private java.util.List<Order> orders = new java.util.ArrayList<>();

    @Transient
    private String fullname;


    // Bật cờ xác thực danh tính sau khi người dùng xác nhận qua Email/OTP
    public void verify() {
        this.isVerified = true;
    }

    // Đình chỉ tài khoản người dùng vi phạm (bùng đơn, gian lận...)
    public void block() {
        this.isActive = false;
    }

    // Kích hoạt lại tài khoản sau khi đã bị đình chỉ
    public void activate() {
        this.isActive = true;
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }

    // Cập nhật thông tin hồ sơ cá nhân, bỏ qua các trường null hoặc rỗng
    public void updateProfile(String firstName, String lastName, String phone) {
        if (firstName != null && !firstName.trim().isEmpty()) {
            this.firstName = firstName.trim();
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            this.lastName = lastName.trim();
        }
        if (phone != null && !phone.trim().isEmpty()) {
            this.phone = phone.trim();
        }
    }

    public String getFullname(){
        return this.firstName + " " + this.lastName;
    }
}

