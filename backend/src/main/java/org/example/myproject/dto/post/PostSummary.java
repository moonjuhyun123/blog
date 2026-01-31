package org.example.myproject.dto.post;

import java.time.LocalDateTime;
import lombok.Builder;
import org.example.myproject.entity.Post.Post;

@Builder
public record PostSummary(
        Long id,
        String title,
        Category category,
        int likeCount,
        boolean isPinned,
        boolean isPrivate,
        LocalDateTime createdAt
) {
    public static PostSummary from(Post p, int likeCount) {
        return new PostSummary(
                p.getId(),
                p.getTitle(),
                Category.from(p.getCategory()),
                likeCount,
                p.isPinned(),
                p.isPrivate(),
                p.getCreatedAt()
        );
    }

    @Builder
    public record Category(Long id, String name, String slug) {
        public static Category from(org.example.myproject.entity.category.Category c) {
            return new Category(c.getId(), c.getName(), c.getSlug());
        }
    }
}
