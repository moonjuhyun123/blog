package org.example.myproject.dto.post;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PostCreateRequest(
        @NotBlank String title,
        @NotNull Long categoryId,
        @NotBlank String contentMd,
        Boolean isPrivate
) {}

