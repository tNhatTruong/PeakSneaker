package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "staff_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 50)
    private String department;

    @Column(name = "position_title", nullable = false, length = 100)
    private String positionTitle;

    @Column(name = "staff_status", nullable = false, length = 30)
    @Builder.Default
    private String staffStatus = "ACTIVE"; // ACTIVE, SUSPENDED, TERMINATED

    @Column(name = "joined_at", nullable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();

    @Column(columnDefinition = "TEXT")
    private String notes;
}

