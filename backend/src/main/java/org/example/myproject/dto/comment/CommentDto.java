package org.example.myproject.dto.comment;

import java.time.LocalDateTime;
import lombok.Builder;
import org.example.myproject.entity.comment.Comment;
import org.example.myproject.entity.news.NewsComment;
import org.example.myproject.entity.user.User;

@Builder
public record CommentDto(
        Long id,
        String content,
        Author author,
        LocalDateTime createdAt,
        boolean deleted
) {
    public static CommentDto from(Comment c) {
        return fromAuthorContent(c.getId(), c.getContent(), c.getAuthor(), c.getCreatedAt(), c.isDeleted());
    }

    public static CommentDto from(NewsComment c) {
        return fromAuthorContent(c.getId(), c.getContent(), c.getAuthor(), c.getCreatedAt(), c.isDeleted());
    }

    private static CommentDto fromAuthorContent(Long id, String content, User author, LocalDateTime createdAt, boolean deleted) {
        return new CommentDto(
                id,
                content,
                Author.from(author),
                createdAt,
                deleted
        );
    }

    @Builder
    public record Author(Long id, String displayName, String profileImageUrl) {
        public static Author from(User u) {
            return new Author(u.getId(), u.getDisplayName(), u.getProfileImageUrl());
        }
    }
}

