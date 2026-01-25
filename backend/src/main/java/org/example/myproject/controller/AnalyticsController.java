package org.example.myproject.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.analytics.VisitSummary;
import org.example.myproject.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analytics;

    @PostMapping("/visit")
    public ResponseEntity<VisitSummary> visit(HttpServletRequest req) {
        return ResponseEntity.ok(analytics.visitOnce(req));
    }

    @GetMapping("/summary")
    public ResponseEntity<VisitSummary> summary(HttpServletRequest req) {
        return ResponseEntity.ok(analytics.summary(req));
    }
}

