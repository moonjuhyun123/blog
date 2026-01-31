package org.example.myproject.dto.post;

import jakarta.validation.constraints.NotNull;

public record PostPinRequest(@NotNull Boolean pinned) {}
