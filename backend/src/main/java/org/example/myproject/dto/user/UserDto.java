package org.example.myproject.dto.user;


import org.example.myproject.entity.user.UserRole;

public record UserDto(
        Long id,
        String email,
        String displayName,
        String profileImageUrl,
        UserRole role,
        boolean blocked
) {}

