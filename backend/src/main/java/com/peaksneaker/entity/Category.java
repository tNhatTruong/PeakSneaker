package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

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

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Trả về true nếu đây là danh mục gốc (không có danh mục cha)
    public boolean isRoot() {
        return this.parent == null;
    }

    // Thay đổi danh mục cha, đồng thời phòng chống vòng lặp đệ quy vô hạn
    public void changeParent(Category newParent) {
        if (newParent != null) {
            if (newParent.getId() != null && newParent.getId().equals(this.getId())) {
                throw new IllegalArgumentException("Một danh mục không thể làm danh mục cha của chính nó.");
            }
            // Duyệt ngược lên trên từ cha mới để xem có đi qua danh mục hiện tại hay không
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

