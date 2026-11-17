package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "silhouettes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Silhouette {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Transient
    @Builder.Default
    private boolean isDeleted = false;
}
