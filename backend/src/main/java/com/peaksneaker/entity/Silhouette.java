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

    @Column(nullable = false)
    private String name;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;
}
