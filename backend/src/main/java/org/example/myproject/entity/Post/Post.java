package org.example.myproject.entity.Post;

import jakarta.persistence.*;
import lombok.*;
import org.example.myproject.entity.BaseTimeEntity;
import org.example.myproject.entity.category.Category;
import org.example.myproject.entity.comment.Comment;
import org.example.myproject.entity.like.PostLike;
import org.example.myproject.entity.user.User;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "posts",
        indexes = {
                @Index(name = "idx_post_createdAt_desc", columnList = "created_at DESC"),
                @Index(name = "idx_post_title", columnList = "title"),
                @Index(name = "idx_post_isPrivate", columnList = "is_private")
        }
)
public class Post extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(length = 300, nullable = false)
    private String title;

    public void setTitle(String title) {
        this.title = title;
    }

    @Lob
    @Column(name = "content_md", columnDefinition = "LONGTEXT", nullable = false)
    private String contentMd;

    @Lob
    @Column(name = "content_html", columnDefinition = "LONGTEXT", nullable = false)
    private String contentHtml;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_post_author"))
    private User author;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_post_category"))
    private Category category;

    // ✅ Post 삭제 시 댓글/좋아요도 함께 삭제되도록 연쇄 설정
    @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();
    @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<PostLike> likes = new ArrayList<>();

    public void updateContent(String md, String html) {
        this.contentMd = md;
        this.contentHtml = html;
    }

    public void moveCategory(Category category) {
        this.category = category;
    }

    public void setPrivate(boolean flag) { this.isPrivate = flag; }


}

