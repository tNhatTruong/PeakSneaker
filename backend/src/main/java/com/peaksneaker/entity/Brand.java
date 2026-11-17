package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Transient
    @Builder.Default
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Silhouette> silhouettes = new ArrayList<>();

    public Boolean getIsDeleted() {
        return !Boolean.TRUE.equals(this.isActive);
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
        this.isActive = !Boolean.TRUE.equals(isDeleted);
    }
}
