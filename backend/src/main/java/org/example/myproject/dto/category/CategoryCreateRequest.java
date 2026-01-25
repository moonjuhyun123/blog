package org.example.myproject.dto.category;

import jakarta.validation.constraints.NotBlank;
public record CategoryCreateRequest(
        @NotBlank String name
) {}
