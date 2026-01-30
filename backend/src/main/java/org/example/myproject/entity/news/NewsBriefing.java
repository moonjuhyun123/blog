package org.example.myproject.entity.news;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.example.myproject.entity.BaseTimeEntity;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(
        name = "news_briefings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_news_briefing_date", columnNames = "briefing_date")
        },
        indexes = {
                @Index(name = "idx_news_briefing_date", columnList = "briefing_date")
        }
)
public class NewsBriefing extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "briefing_date", nullable = false)
    private LocalDate briefingDate;

    @Column(name = "content_html", columnDefinition = "TEXT", nullable = false)
    private String contentHtml;

    public void updateContent(String contentHtml) {
        this.contentHtml = contentHtml;
    }
}
