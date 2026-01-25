package org.example.myproject.entity.visit;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "visit_seen",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_visit_seen_date_fphash",
                        columnNames = {"visit_date", "fp_hash"}
                )
        },
        indexes = {
                @Index(name = "idx_visit_seen_date", columnList = "visit_date")
        }
)
public class VisitSeen {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "fp_hash", length = 128, nullable = false)
    private String fpHash;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "ua_hash", length = 64)
    private String uaHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
