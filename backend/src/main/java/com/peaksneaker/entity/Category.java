package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    private java.util.List<Category> children = new java.util.ArrayList<>();


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

