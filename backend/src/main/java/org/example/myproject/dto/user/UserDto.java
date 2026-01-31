package org.example.myproject.dto.user;


import lombok.Builder;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;

@Builder
public record UserDto(
        Long id,
        String email,
        String displayName,
        String profileImageUrl,
        UserRole role,
        boolean blocked
) {
    public static UserDto from(User u) {
        return new UserDto(
                u.getId(),
                u.getEmail(),
                u.getDisplayName(),
                u.getProfileImageUrl(),
                u.getRole(),
                u.isBlocked()
        );
    }
}

