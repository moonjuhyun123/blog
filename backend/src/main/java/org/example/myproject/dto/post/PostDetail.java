package org.example.myproject.dto.post;

import java.time.LocalDateTime;

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
) {}
