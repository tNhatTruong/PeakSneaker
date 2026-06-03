package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_type", nullable = false, length = 50)
    private String referenceType; // PRODUCT | CATEGORY | USER | VARIANT

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "image_name")
    private String imageName;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

}
