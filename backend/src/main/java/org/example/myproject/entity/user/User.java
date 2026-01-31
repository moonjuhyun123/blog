package org.example.myproject.entity.user;

import jakarta.persistence.*;
import lombok.*;
import org.example.myproject.entity.BaseTimeEntity;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_email", columnNames = "email")
        },
        indexes = {
                @Index(name = "idx_user_email", columnList = "email")
        }
)
public class User extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 320, nullable = false)
    private String email;

    @Column(length = 255, nullable = false)
    private String password;

    @Column(name = "display_name", length = 100, nullable = false)
    private String displayName;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private UserRole role;

    @Column(nullable = false)
    private boolean blocked;

    // ✅ 닉네임 변경용 메서드
    public void changeDisplayName(String newName) {
        this.displayName = newName;
    }

    // ✅ 프로필 이미지 URL 변경용 메서드
    public void changeProfileImageUrl(String newUrl) {
        this.profileImageUrl = newUrl;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void promoteToAdmin() {
        this.role = UserRole.ADMIN;
    }

    public void ensureActive() {
        this.blocked = false;
    }

    public void block() { this.blocked = true; }
    public void unblock() { this.blocked = false; }
}

