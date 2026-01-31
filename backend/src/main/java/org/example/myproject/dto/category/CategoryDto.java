package org.example.myproject.dto.category;

import java.time.LocalDateTime;
import lombok.Builder;
import org.example.myproject.entity.category.Category;

@Builder
public record CategoryDto(
        Long id, String name, String slug, LocalDateTime createdAt, Integer sortOrder
) {
    public static CategoryDto from(Category c) {
        return new CategoryDto(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getCreatedAt(),
                c.getSortOrder()
        );
    }
}

