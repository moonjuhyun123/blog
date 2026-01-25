package org.example.myproject.service;

import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.media.UploadImageResponse;
import org.example.myproject.entity.media.MediaImage;
import org.example.myproject.entity.user.User;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.media.MediaImageRepository;
import org.example.myproject.util.MediaUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service @RequiredArgsConstructor
public class MediaService {

    private final MediaImageRepository repo;

    public UploadImageResponse upload(@NotNull MultipartFile file, String uploadDir, User uploader) {
        if (!"image/jpeg".equalsIgnoreCase(file.getContentType()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "MIME must be image/jpeg");
        String url;
        try { url = MediaUtils.saveJpg(file, uploadDir, "posts"); }
        catch (IOException e) { throw new ApiException(HttpStatus.BAD_REQUEST, "upload failed"); }

        // ✅ 앞에 "uploads/" 추가
        if (!url.startsWith("uploads/")) {
            url = "/uploads/" + url.replaceFirst("^/+", ""); // 중복 슬래시 방지
        }

        MediaImage m = MediaImage.builder()
                .url(url).mimeType("image/jpeg")
                .bytes(file.getSize())
                .uploader(uploader).build();
        repo.save(m);
        return new UploadImageResponse(url);
    }
}

