package org.example.myproject.controller;


import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.dto.common.PageResponse;
import org.example.myproject.dto.post.*;
import org.example.myproject.service.PostService;
import org.example.myproject.service.UserService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api")
public class PostController {

    private final PostService posts;
    private final UserService users;

    @GetMapping("/posts")
    public ResponseEntity<PageResponse<PostSummary>> list(
            @RequestParam(required=false) Integer page,
            @RequestParam(required=false) Integer size,
            @RequestParam(required=false) String title,
            @RequestParam(required=false, name="categoryId") String categoryIds,
            @RequestParam(required=false, defaultValue = "false") Boolean includePrivate,
            HttpServletRequest req
    ) {
        var current = users.currentUser(req);
        return ResponseEntity.ok(posts.search(page, size, title, categoryIds, includePrivate, current));
    }

    @PostMapping("/posts")
    public ResponseEntity<IdOnly> create(HttpServletRequest req, @Valid @RequestBody PostCreateRequest body) {
        var admin = users.requireUser(req);
        return ResponseEntity.status(201).body(posts.create(body, admin));
    }

    @GetMapping("/categories/{categoryId}/posts")
    public ResponseEntity<PageResponse<PostSummary>> byCategory(
            @PathVariable Long categoryId,
            @RequestParam(required=false) Integer page,
            @RequestParam(required=false) Integer size,
            @RequestParam(required=false) String title
    ) {
        return ResponseEntity.ok(posts.listByCategory(categoryId, page, size, title));
    }

//    @PostMapping("/categories/{categoryId}/posts")
//    public ResponseEntity<IdOnly> createInCategory(
//            HttpServletRequest req, @PathVariable Long categoryId,
//            @Valid @RequestBody PostCreateInCategoryRequest body
//    ) {
//        var admin = users.requireUser(req);
//        return ResponseEntity.status(201).body(posts.createInCategory(categoryId, body, admin));
//    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostDetail> get(@PathVariable Long id, HttpServletRequest req) {
        var current = users.currentUser(req);
        return ResponseEntity.ok(posts.get(id, current));
    }

    @PatchMapping(value = "/posts/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<IdOnly> update(@PathVariable Long id, HttpServletRequest req, @Valid @RequestBody PostUpdateRequest body) {
        var admin = users.requireUser(req);
        return ResponseEntity.ok(posts.update(id, body, admin));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest req) {
        var admin = users.requireUser(req);
        posts.delete(id, admin);
        return ResponseEntity.noContent().build();
    }
}

