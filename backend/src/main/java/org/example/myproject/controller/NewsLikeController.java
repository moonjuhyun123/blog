package org.example.myproject.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.like.LikeToggleResponse;
import org.example.myproject.service.NewsLikeService;
import org.example.myproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/news/{newsId}/like")
public class NewsLikeController {
    private final NewsLikeService likes;
    private final UserService users;

    @PostMapping
    public ResponseEntity<LikeToggleResponse> toggle(@PathVariable Long newsId, HttpServletRequest req) {
        var u = users.requireUser(req);
        return ResponseEntity.ok(likes.toggle(newsId, u));
    }
}
