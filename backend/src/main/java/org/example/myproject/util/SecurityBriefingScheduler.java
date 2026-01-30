package org.example.myproject.util;

import lombok.extern.slf4j.Slf4j;
import org.example.myproject.service.SecurityBriefingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SecurityBriefingScheduler {
    private final SecurityBriefingService briefingService;

    public SecurityBriefingScheduler(SecurityBriefingService briefingService) {
        this.briefingService = briefingService;
    }

    // 예: 매일 오전 7시 10분 (KST)
    @Scheduled(cron = "0 10 7 * * *", zone = "Asia/Seoul")
    public void run() {
        String html = briefingService.generateBriefingHtml();

        log.info("SecurityBriefingScheduler is running for {}", html);

        // ✅ 여기서 "DB 저장" 또는 "파일 저장"을 하면 됨.
        // 지금 요청은 "html 저장된 변수만 리턴"이니까 저장 로직은 밖에서 처리하도록 비워둠.
        // saveToDb(html);
    }
}
