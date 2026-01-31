package org.example.myproject.service;


import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.user.UserDto;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.user.UserRepository;
import org.example.myproject.security.JwtProvider;
import org.example.myproject.util.MediaUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service @RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepo;
    private final JwtProvider jwtProvider;

    public User currentUser(HttpServletRequest req) {
        String at = extractCookie(req, JwtProvider.ACCESS);
        if (at == null) return null;
        try {
            Long id = jwtProvider.getUserId(at);
            return userRepo.findById(id).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    public User requireUser(HttpServletRequest req) {
        User u = currentUser(req);
        if (u == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        return u;
    }

    private String extractCookie(HttpServletRequest req, String name) {
        if (req.getCookies()==null) return null;
        for (Cookie c: req.getCookies()) if (name.equals(c.getName())) return c.getValue();
        return null;
    }

    @Transactional
    public UserDto updateProfile(HttpServletRequest req,
                                 String displayName,
                                 MultipartFile profileImage,
                                 String uploadDir) {
        // 1) 인증 유저(영속 상태 엔티티)
        User u = requireUser(req); // 구현돼 있다고 가정

        // 2) 닉네임 변경
        if (displayName != null && !displayName.isBlank()) {
            u.changeDisplayName(displayName.trim());
        }

        // 3) 프로필 이미지 변경 (jpg만 허용)
        if (profileImage != null && !profileImage.isEmpty()) {
            // (1) 용량 보호 (선택)
            final long MAX_BYTES = 5L * 1024 * 1024; // 5MB
            if (profileImage.getSize() > MAX_BYTES) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "file too large (<=5MB)");
            }

            // (2) jpg 검사( Content-Type 또는 확장자 )
            String ct = profileImage.getContentType(); // null 가능
            String original = profileImage.getOriginalFilename(); // null 가능
            boolean mimeOk = ct != null && (ct.equalsIgnoreCase("image/jpeg") || ct.equalsIgnoreCase("image/jpg"));
            boolean extOk  = original != null && original.toLowerCase().matches(".*\\.(jpg|jpeg)$");
            if (!(mimeOk || extOk)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "jpg only");
            }

            // (3) 저장 (예: {uploadDir}/profiles/YYYY/MM/uuid.jpg)
            try {
                String savedRelPath = MediaUtils.saveJpg(profileImage, uploadDir, "profiles");
                // 기존 이미지 정리(선택): DB에 이전 경로가 있다면 삭제
                String old = u.getProfileImageUrl();
                u.changeProfileImageUrl(savedRelPath);
                // 필요 시 실제 파일 삭제 (예외는 삼켜 안정성 보장)
                if (old != null && !old.isBlank()) {
                    try { MediaUtils.safeDelete(uploadDir, old); } catch (Exception ignore) {}
                }
            } catch (IOException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "upload fail: " + e.getMessage());
            }
        }

        // 4) 반환 (더티체킹)
        return UserDto.from(u);
    }


    @Transactional
    public UserDto toggleBlock(Long id, boolean blocked, User admin) {
        if (admin.getRole() != UserRole.ADMIN) throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
        User target = userRepo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found"));
        if (blocked) target.block(); else target.unblock();
        return UserDto.from(target);
    }


}

