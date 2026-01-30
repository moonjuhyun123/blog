package org.example.myproject.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.myproject.service.SecurityBriefingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/briefing")
public class SecurityBriefingController {

    private final SecurityBriefingService briefingService;

    public SecurityBriefingController(SecurityBriefingService briefingService) {
        this.briefingService = briefingService;
    }

    /**
     * ✅ 스케줄러 수동 실행용 엔드포인트
     * - 크론이 하는 것과 동일한 로직
     * - 결과: HTML 문자열 그대로 반환
     */
    @PostMapping("/run")
    public ResponseEntity<String> runBriefing() {
        log.info("runBriefing");
        String html = briefingService.generateBriefingHtml();
        return ResponseEntity.ok(html);
    }
}
