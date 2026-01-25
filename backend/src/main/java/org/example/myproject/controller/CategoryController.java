package org.example.myproject.controller;


import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.category.CategoryCreateRequest;
import org.example.myproject.dto.category.CategoryUpdateRequest;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.service.CategoryService;
import org.example.myproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categories;
    private final UserService users;

    @GetMapping
    public ResponseEntity<?> list() { return ResponseEntity.ok(categories.list()); }

    @PostMapping
    public ResponseEntity<IdOnly> create(HttpServletRequest req, @Valid @RequestBody CategoryCreateRequest body) {
        var admin = users.requireUser(req);
        return ResponseEntity.status(201).body(categories.create(body, admin));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(HttpServletRequest req, @PathVariable Long id, @Valid @RequestBody CategoryUpdateRequest body) {
        var admin = users.requireUser(req);
        return ResponseEntity.ok(categories.update(id, body, admin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(HttpServletRequest req, @PathVariable Long id) {
        var admin = users.requireUser(req);
        categories.delete(id, admin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summaryByCount(
            HttpServletRequest req,
            @RequestParam(required = false, defaultValue = "false") Boolean includePrivate
    ) {
        var me = users.currentUser(req); // 로그인 안 되어도 OK → 공개글 기준으로 집계
        return ResponseEntity.ok(categories.listWithCounts(me, includePrivate));
    }

}
