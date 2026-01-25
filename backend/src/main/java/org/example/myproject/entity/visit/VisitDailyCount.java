package org.example.myproject.entity.visit;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "visit_daily_count",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_visit_daily_date", columnNames = "date")
        }
)
public class VisitDailyCount {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "count", nullable = false)
    private Long count;

    public void increase(long delta) {
        this.count = (this.count == null ? 0 : this.count) + delta;
    }
}

