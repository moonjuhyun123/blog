package org.example.myproject.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.media.UploadImageResponse;
import org.example.myproject.service.MediaService;
import org.example.myproject.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api/media")
public class MediaController {
    private final MediaService media;
    private final UserService users;

    @Value("${app.upload-dir:./uploads}") String uploadDir;

    @PostMapping("/image")
    public ResponseEntity<UploadImageResponse> upload(HttpServletRequest req, @RequestPart("file") MultipartFile file) {
        var u = users.requireUser(req);
        return ResponseEntity.status(201).body(media.upload(file, uploadDir, u));
    }
}

