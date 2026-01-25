package org.example.myproject.repository.visit;


import java.time.LocalDate;
import java.util.Optional;

import org.example.myproject.entity.visit.VisitSeen;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitSeenRepository extends JpaRepository<VisitSeen, Long> {
    Optional<VisitSeen> findByVisitDateAndFpHash(LocalDate date, String fpHash);
    long countByVisitDate(LocalDate date);
}
