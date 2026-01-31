package org.example.myproject.service;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.analytics.VisitSummary;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.entity.visit.VisitDailyCount;
import org.example.myproject.entity.visit.VisitSeen;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.visit.VisitDailyCountRepository;
import org.example.myproject.repository.visit.VisitSeenRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class AnalyticsService {

    private final VisitSeenRepository seenRepo;
    private final VisitDailyCountRepository dailyRepo;

    @Transactional
    public VisitSummary visitOnce(HttpServletRequest req) {
        LocalDate today = LocalDate.now();
        String ip = req.getRemoteAddr();
        String ua = req.getHeader("User-Agent");
        String fp = req.getHeader("X-Visitor-FP"); // 프론트가 주는 지문 해시(없어도 ok)
        if (fp==null || fp.isBlank()) fp = "FP-" + sha(ip + "|" + ua);

        // 중복 체크 후 새로운 방문자일 때만 저장 및 카운트 증가
        boolean isNewVisitor = seenRepo.findByVisitDateAndFpHash(today, fp).isEmpty();
        if (isNewVisitor) {
            seenRepo.save(VisitSeen.builder()
                    .visitDate(today).fpHash(fp)
                    .ipHash(sha(ip)).uaHash(sha(ua))
                    .build());
            
            var daily = dailyRepo.findByDate(today)
                    .orElseGet(() -> dailyRepo.save(VisitDailyCount.builder().date(today).count(0L).build()));
            daily.increase(1);
        }

        // 현재 카운트 반환 (증가 여부와 관계없이)
        long dailyCount = dailyRepo.findByDate(today).map(v -> v.getCount() == null ? 0 : v.getCount()).orElse(0L);
        long total = dailyRepo.findAll().stream().mapToLong(v-> v.getCount()==null?0:v.getCount()).sum();
        return new VisitSummary(dailyCount, total);
    }

    public VisitSummary summary(jakarta.servlet.http.HttpServletRequest req) {
        LocalDate today = LocalDate.now();
        long daily = dailyRepo.findByDate(today).map(v -> v.getCount() == null ? 0 : v.getCount()).orElse(0L);
        long total = dailyRepo.findAll().stream().mapToLong(v-> v.getCount()==null?0:v.getCount()).sum();
        return new VisitSummary(daily, total);
    }

    private static String sha(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest((s==null?"":s).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : h) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { return ""; }
    }
}
