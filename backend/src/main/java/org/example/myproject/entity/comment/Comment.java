package org.example.myproject.entity.comment;

import jakarta.persistence.*;
import lombok.*;
import org.example.myproject.entity.BaseTimeEntity;
import org.example.myproject.entity.Post.Post;
import org.example.myproject.entity.user.User;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "comments",
        indexes = {
                @Index(name = "idx_comment_post_createdAt", columnList = "post_id, created_at")
        }
)
public class Comment extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_comment_author"))
    private User author;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_comment_post"))
    private Post post;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;

    public void softDelete() {
        this.deleted = true;
        this.deletedAt = java.time.LocalDateTime.now();
    }

    public void edit(String newContent) {
        this.content = newContent;
    }
}

