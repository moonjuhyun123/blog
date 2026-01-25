package org.example.myproject.entity.media;


import jakarta.persistence.*;
import lombok.*;
import org.example.myproject.entity.BaseTimeEntity;
import org.example.myproject.entity.user.User;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "media_images",
        indexes = {
                @Index(name = "idx_media_createdAt", columnList = "created_at")
        }
)
public class MediaImage extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500, nullable = false)
    private String url;

    @Column(name = "mime_type", length = 100, nullable = false)
    private String mimeType;

    // BIGINT NULL → Long (nullable)
    @Column
    private Long bytes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploader_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_media_uploader"))
    private User uploader;
}

