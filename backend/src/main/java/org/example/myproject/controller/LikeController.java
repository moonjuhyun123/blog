package org.example.myproject.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.like.LikeToggleResponse;
import org.example.myproject.service.LikeService;
import org.example.myproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api/posts/{postId}/like")
public class LikeController {
    private final LikeService likes;
    private final UserService users;

    @PostMapping
    public ResponseEntity<LikeToggleResponse> toggle(@PathVariable Long postId, HttpServletRequest req) {
        var u = users.requireUser(req);
        return ResponseEntity.ok(likes.toggle(postId, u));
    }
}

