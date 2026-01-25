package org.example.myproject.dto.comment;

import java.time.LocalDateTime;

public record CommentDto(
        Long id,
        String content,
        Author author,
        LocalDateTime createdAt,
        boolean deleted
) {
    public record Author(Long id, String displayName, String profileImageUrl) {}
}

