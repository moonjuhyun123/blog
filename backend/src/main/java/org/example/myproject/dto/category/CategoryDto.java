package org.example.myproject.dto.category;

import java.time.LocalDateTime;

public record CategoryDto(
        Long id, String name, String slug, LocalDateTime createdAt, Integer sortOrder
) {}

