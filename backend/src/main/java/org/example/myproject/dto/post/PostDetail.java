package org.example.myproject.dto.post;

import java.time.LocalDateTime;
import lombok.Builder;
import org.example.myproject.entity.Post.Post;

@Builder
public record PostDetail(
        Long id,
        String title,
        PostSummary.Category category,
        int likeCount,
        boolean isPinned,
        boolean isPrivate,
        LocalDateTime createdAt,
        String contentMd,
        String contentHtml,
        LocalDateTime updatedAt
) {
    public static PostDetail from(Post p, int likeCount) {
        return new PostDetail(
                p.getId(),
                p.getTitle(),
                PostSummary.Category.from(p.getCategory()),
                likeCount,
                p.isPinned(),
                p.isPrivate(),
                p.getCreatedAt(),
                p.getContentMd(),
                p.getContentHtml(),
                p.getUpdatedAt()
        );
    }
}
