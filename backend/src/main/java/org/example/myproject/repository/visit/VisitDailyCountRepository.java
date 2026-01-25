package org.example.myproject.repository.visit;

import java.time.LocalDate;
import java.util.Optional;

import org.example.myproject.entity.visit.VisitDailyCount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitDailyCountRepository extends JpaRepository<VisitDailyCount, Long> {
    Optional<VisitDailyCount> findByDate(LocalDate date);
}

