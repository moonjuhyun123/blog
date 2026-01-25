package org.example.myproject.controller;


import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.user.BlockToggleRequest;
import org.example.myproject.dto.user.UserDto;
import org.example.myproject.mapper.DtoMapper;
import org.example.myproject.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(HttpServletRequest req) {
        return ResponseEntity.ok(DtoMapper.toUserDto(users.requireUser(req)));
    }

    @PatchMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> patchMe(
            HttpServletRequest req,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage
    ) {
        return ResponseEntity.ok(users.updateProfile(req, displayName, profileImage, uploadDir));
    }



    @PatchMapping("/{id}/block")
    public ResponseEntity<?> toggleBlock(
            HttpServletRequest req,
            @PathVariable Long id,
            @Valid @RequestBody BlockToggleRequest body
    ) {
        var admin = users.requireUser(req);
        return ResponseEntity.ok(users.toggleBlock(id, body.blocked(), admin));
    }
}

