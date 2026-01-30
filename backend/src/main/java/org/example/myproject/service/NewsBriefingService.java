package org.example.myproject.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.myproject.dto.news.NewsBriefingDto;
import org.example.myproject.entity.news.NewsBriefing;
import org.example.myproject.repository.news.NewsBriefingRepository;
import org.example.myproject.repository.news.NewsLikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsBriefingService {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final NewsBriefingRepository newsBriefings;
    private final SecurityBriefingService briefingService;
    private final NewsLikeRepository newsLikes;

    @Transactional
    public NewsBriefingDto generateAndSaveToday() {
        LocalDate today = LocalDate.now(KST);
        try {
            log.info("[news] generateAndSaveToday start date={}", today);
            String html = briefingService.generateBriefingHtml();
            NewsBriefing saved = upsert(today, html);
            log.info("[news] generateAndSaveToday saved id={} date={} htmlChars={}",
                    saved.getId(), saved.getBriefingDate(), html != null ? html.length() : 0);
            return toDto(saved);
        } catch (Exception e) {
            log.error("[news] generateAndSaveToday failed date={} msg={}", today, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public NewsBriefingDto save(LocalDate briefingDate, String contentHtml) {
        NewsBriefing saved = upsert(briefingDate, contentHtml);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<NewsBriefingDto> list(LocalDate from, LocalDate to, String q) {
        String query = (q == null) ? null : q.trim();
        boolean hasQ = query != null && !query.isBlank();
        boolean hasFrom = from != null;
        boolean hasTo = to != null;

        List<NewsBriefing> items;
        if (hasFrom && hasTo) {
            items = hasQ
                    ? newsBriefings.findByBriefingDateBetweenAndContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(
                            from, to, query)
                    : newsBriefings.findByBriefingDateBetweenOrderByBriefingDateDesc(from, to);
        } else if (hasFrom) {
            items = hasQ
                    ? newsBriefings.findByBriefingDateGreaterThanEqualAndContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(
                            from, query)
                    : newsBriefings.findByBriefingDateGreaterThanEqualOrderByBriefingDateDesc(from);
        } else if (hasTo) {
            items = hasQ
                    ? newsBriefings.findByBriefingDateLessThanEqualAndContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(
                            to, query)
                    : newsBriefings.findByBriefingDateLessThanEqualOrderByBriefingDateDesc(to);
        } else {
            items = hasQ
                    ? newsBriefings.findByContentHtmlContainingIgnoreCaseOrderByBriefingDateDesc(query)
                    : newsBriefings.findAllByOrderByBriefingDateDesc();
        }

        return items.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public NewsBriefingDto getByDate(LocalDate briefingDate) {
        NewsBriefing found = newsBriefings.findByBriefingDate(briefingDate)
                .orElseThrow(() -> new org.example.myproject.exception.ApiException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Not Found"));
        return toDto(found);
    }

    private NewsBriefing upsert(LocalDate briefingDate, String contentHtml) {
        NewsBriefing existing = newsBriefings.findByBriefingDate(briefingDate).orElse(null);
        if (existing != null) {
            existing.updateContent(contentHtml);
            return existing;
        }
        NewsBriefing created = NewsBriefing.builder()
                .briefingDate(briefingDate)
                .contentHtml(contentHtml)
                .build();
        return newsBriefings.save(created);
    }

    private NewsBriefingDto toDto(NewsBriefing entity) {
        int likeCount = (int) newsLikes.countByBriefing(entity);
        return new NewsBriefingDto(
                entity.getId(),
                entity.getBriefingDate(),
                entity.getContentHtml(),
                entity.getCreatedAt(),
                likeCount
        );
    }
}
