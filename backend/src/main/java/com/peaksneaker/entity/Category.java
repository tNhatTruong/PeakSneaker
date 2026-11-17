package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Category> children = new ArrayList<>();

    public boolean isRoot() {
        return this.parent == null;
    }

    public void changeParent(Category newParent) {
        if (newParent != null) {
            if (newParent.getId() != null && newParent.getId().equals(this.getId())) {
                throw new IllegalArgumentException("Một danh mục không thể làm danh mục cha của chính nó.");
            }
            Category current = newParent.getParent();
            while (current != null) {
                if (this.getId() != null && this.getId().equals(current.getId())) {
                    throw new IllegalArgumentException("Lỗi vòng lặp đệ quy: Danh mục cha mới là danh mục con của danh mục hiện tại.");
                }
                current = current.getParent();
            }
        }
        this.parent = newParent;
    }
}
