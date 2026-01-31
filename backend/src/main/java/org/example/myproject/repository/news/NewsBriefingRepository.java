package org.example.myproject.repository.news;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.example.myproject.entity.news.NewsBriefing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsBriefingRepository extends JpaRepository<NewsBriefing, Long> {
    Optional<NewsBriefing> findByBriefingDate(LocalDate briefingDate);
    List<NewsBriefing> findAllByOrderByBriefingDateDesc();
    List<NewsBriefing> findByBriefingDateBetweenOrderByBriefingDateDesc(LocalDate from, LocalDate to);
    List<NewsBriefing> findByBriefingDateBetweenAndContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(
            LocalDate from, LocalDate to, String q
    );
    List<NewsBriefing> findByBriefingDateGreaterThanEqualOrderByBriefingDateDesc(LocalDate from);
    List<NewsBriefing> findByBriefingDateGreaterThanEqualAndContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(
            LocalDate from, String q
    );
    List<NewsBriefing> findByBriefingDateLessThanEqualOrderByBriefingDateDesc(LocalDate to);
    List<NewsBriefing> findByBriefingDateLessThanEqualAndContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(
            LocalDate to, String q
    );
    List<NewsBriefing> findByContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(String q);
}
