package org.example.myproject.dto.category;

import jakarta.validation.constraints.NotBlank;
public record CategoryUpdateRequest(@NotBlank String name) {}
