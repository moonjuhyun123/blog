package org.example.myproject.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PostUpdateRequest(
        @NotBlank String title,
        @NotNull Long categoryId,
        @NotNull String contentMd,
        @NotNull Boolean isPrivate
) {}

