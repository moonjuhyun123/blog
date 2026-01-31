package org.example.myproject.util;

import lombok.extern.slf4j.Slf4j;
import org.example.myproject.service.NewsBriefingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SecurityBriefingScheduler {
    private final NewsBriefingService newsBriefings;

    public SecurityBriefingScheduler(NewsBriefingService newsBriefings) {
        this.newsBriefings = newsBriefings;
    }

    // 예: 매일 오전 7시 10분 (KST)
    @Scheduled(cron = "0 10 7 * * *", zone = "Asia/Seoul")
    public void run() {
        var saved = newsBriefings.generateAndSaveToday();
        log.info("SecurityBriefingScheduler saved briefing id={} date={}", saved.id(), saved.briefingDate());
    }
}
