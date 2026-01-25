package org.example.myproject.dto.category;

import java.time.LocalDateTime;

public record CategoryWithCountDto(
        Long id,
        String name,
        String slug,
        LocalDateTime createdAt,
        long postCount
) {}
