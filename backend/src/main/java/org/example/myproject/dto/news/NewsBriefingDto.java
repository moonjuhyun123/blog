package org.example.myproject.dto.news;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record NewsBriefingDto(
        Long id,
        LocalDate briefingDate,
        String contentHtml,
        LocalDateTime createdAt,
        int likeCount
) {}
