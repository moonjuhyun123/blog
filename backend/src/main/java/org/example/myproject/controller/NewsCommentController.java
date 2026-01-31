package org.example.myproject.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.comment.CommentCreateRequest;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.service.NewsCommentService;
import org.example.myproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/news")
public class NewsCommentController {

    private final NewsCommentService comments;
    private final UserService users;

    @GetMapping("/{newsId}/comments")
    public ResponseEntity<?> list(@PathVariable Long newsId) {
        return ResponseEntity.ok(comments.list(newsId));
    }

    @PostMapping("/{newsId}/comments")
    public ResponseEntity<IdOnly> create(
            HttpServletRequest req,
            @PathVariable Long newsId,
            @Valid @RequestBody CommentCreateRequest body
    ) {
        var u = users.requireUser(req);
        return ResponseEntity.status(201).body(comments.create(newsId, body, u));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> delete(HttpServletRequest req, @PathVariable Long id) {
        var u = users.requireUser(req);
        comments.delete(id, u);
        return ResponseEntity.noContent().build();
    }
}
