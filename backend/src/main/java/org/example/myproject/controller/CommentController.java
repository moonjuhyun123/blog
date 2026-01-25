package org.example.myproject.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.comment.CommentCreateRequest;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.service.CommentService;
import org.example.myproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api")
public class CommentController {

    private final CommentService comments;
    private final UserService users;

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<?> list(@PathVariable Long postId) {
        return ResponseEntity.ok(comments.list(postId));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<IdOnly> create(HttpServletRequest req, @PathVariable Long postId, @Valid @RequestBody CommentCreateRequest body) {
        var u = users.requireUser(req);
        return ResponseEntity.status(201).body(comments.create(postId, body, u));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> delete(HttpServletRequest req, @PathVariable Long id) {
        var u = users.requireUser(req);
        comments.delete(id, u);
        return ResponseEntity.noContent().build();
    }
}

