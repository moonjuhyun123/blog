package org.example.myproject.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.example.myproject.dto.news.NewsBriefingDto;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.service.NewsBriefingService;
import org.example.myproject.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/briefing")
public class SecurityBriefingController {

    private final NewsBriefingService newsBriefings;
    private final UserService users;

    public SecurityBriefingController(NewsBriefingService newsBriefings, UserService users) {
        this.newsBriefings = newsBriefings;
        this.users = users;
    }

    /**
     * ✅ 스케줄러 수동 실행용 엔드포인트
     * - 크론이 하는 것과 동일한 로직
     * - 결과: 생성된 뉴스를 DB에 저장하고 반환
     */
    @PostMapping("/run")
    public ResponseEntity<NewsBriefingDto> runBriefing(HttpServletRequest req) {
        log.info("runBriefing");
        var admin = users.requireUser(req);
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        try {
            return ResponseEntity.ok(newsBriefings.generateAndSaveToday());
        } catch (Exception e) {
            log.error("runBriefing failed userId={} msg={}", admin.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
