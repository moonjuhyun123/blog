package org.example.myproject.entity.category;


import jakarta.persistence.*;
import lombok.*;
import org.example.myproject.entity.BaseTimeEntity;
import org.example.myproject.entity.Post.Post;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "categories",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_category_slug", columnNames = "slug")
        },
        indexes = {
                @Index(name = "idx_category_slug", columnList = "slug")
        }
)
public class Category extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 120, nullable = false)
    private String name;

    @Column(length = 120, nullable = false)
    private String slug;

    @Column(name = "sort_order")
    private Integer sortOrder;

    // ✅ 이 컬렉션에 cascade+orphanRemoval 설정 → 카테고리 삭제 시 하위 게시글도 함께 삭제
    @OneToMany(
            mappedBy = "category",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true
    )
    private List<Post> posts = new ArrayList<>();

    public void updateSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}

