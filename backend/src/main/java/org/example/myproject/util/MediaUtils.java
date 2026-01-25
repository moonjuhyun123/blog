package org.example.myproject.util;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Locale;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class MediaUtils {

    /**
     * 멱등/보안: 상대 경로만 반환. 저장은 {uploadDir}/{category}/YYYY/MM/uuid.jpg
     * @return DB에 저장할 상대 경로. 예) /profiles/2025/10/uuid.jpg
     */
    public static String saveJpg(MultipartFile file, String uploadDir, String category) throws IOException {
        // 경로 구성
        String y = String.format("%tY", System.currentTimeMillis());
        String m = String.format("%tm", System.currentTimeMillis());
        String sub = "/" + sanitize(category) + "/" + y + "/" + m;
        Path dir = Paths.get(uploadDir + sub).normalize().toAbsolutePath();

        Files.createDirectories(dir);

        String filename = UUID.randomUUID().toString().replace("-", "") + ".jpg";
        Path dest = dir.resolve(filename).normalize();

        // 디코드 → 무조건 jpg로 인코딩
        try (InputStream in = file.getInputStream()) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                throw new IOException("invalid image data");
            }
            // EXIF 회전 보정이 필요하면 여기에 추가 (지금은 단순 저장)
            try (OutputStream out = Files.newOutputStream(dest, StandardOpenOption.CREATE_NEW)) {
                boolean ok = ImageIO.write(image, "jpg", out);
                if (!ok) throw new IOException("ImageIO encode fail");
            }
        }

        // 정적서빙 기준의 상대경로를 반환 (컨트롤러/프론트에서 그대로 붙여 쓰기)
        return sub + "/" + filename; // 예) /profiles/2025/10/uuid.jpg
    }

    /** uploadDir + relPath 지우기 (relPath가 /로 시작해도 normalize 처리) */
    public static void safeDelete(String uploadDir, String relPath) throws IOException {
        if (relPath == null || relPath.isBlank()) return;
        Path p = Paths.get(uploadDir).resolve(relPath.replaceFirst("^/", "")).normalize();
        // uploadDir 내부 파일만 삭제 허용 (디렉토리 탈출 방지)
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!p.toAbsolutePath().startsWith(root)) return;
        try { Files.deleteIfExists(p); } catch (Exception ignore) {}
    }

    /** 경로 세그먼트에 사용할 간단한 정화 */
    private static String sanitize(String s) {
        if (s == null) return "media";
        return s.replaceAll("[^a-zA-Z0-9_-]", "").toLowerCase(Locale.ROOT);
    }
}

