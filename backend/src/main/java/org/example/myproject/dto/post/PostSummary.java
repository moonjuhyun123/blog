package org.example.myproject.dto.post;

import java.time.LocalDateTime;

public record PostSummary(
        Long id,
        String title,
        Category category,
        int likeCount,
        boolean isPrivate,
        LocalDateTime createdAt
) {
    public record Category(Long id, String name, String slug) {}
}
