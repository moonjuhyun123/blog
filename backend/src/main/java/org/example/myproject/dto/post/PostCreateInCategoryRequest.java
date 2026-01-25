package org.example.myproject.dto.post;


import jakarta.validation.constraints.NotBlank;

public record PostCreateInCategoryRequest(
        @NotBlank String title,
        @NotBlank String contentMd,
        Boolean isPrivate
) {}

