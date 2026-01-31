package org.example.myproject.service;


import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.user.LoginRequest;
import org.example.myproject.dto.user.RegisterRequest;
import org.example.myproject.dto.user.UserDto;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.exception.ApiException;
import org.example.myproject.repository.user.UserRepository;
import org.example.myproject.security.CookieUtil;
import org.example.myproject.security.JwtProperties;
import org.example.myproject.security.JwtProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtProvider jwt;
    private final JwtProperties props;

    @Transactional
    public UserDto register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) throw new ApiException(HttpStatus.CONFLICT, "email exists");
        User u = User.builder()
                .email(req.email())
                .password(encoder.encode(req.password()))
                .displayName(req.displayName())
                .role(UserRole.USER)
                .blocked(false)
                .build();
        return UserDto.from(userRepo.save(u));
    }

    @Transactional(readOnly = true)
    public UserDto login(LoginRequest req, HttpServletResponse res) {
        User u = userRepo.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
        if (!encoder.matches(req.password(), u.getPassword()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized");

        issueCookies(res, u);
        return UserDto.from(u);
    }

    public void issueCookies(HttpServletResponse res, User u) {
        long now = Instant.now().getEpochSecond();
        String at = jwt.createAccessToken(u.getId(), u.getRole().name(), now);
        String rt = jwt.createRefreshToken(u.getId(), now);

        var c = props.getCookie();
        CookieUtil.addHttpOnlyCookie(res, JwtProvider.ACCESS, at, c.getDomain(), c.isSecure(), c.getSameSite(), props.getAccessValidSeconds());
        CookieUtil.addHttpOnlyCookie(res, JwtProvider.REFRESH, rt, c.getDomain(), c.isSecure(), c.getSameSite(), props.getRefreshValidSeconds());
    }

    @Transactional(readOnly = true)
    public void refresh(String refreshToken, HttpServletResponse res) {
        if (!jwt.isRefresh(refreshToken)) throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        Long uid = jwt.getUserId(refreshToken);
        User u = userRepo.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
        issueCookies(res, u);
    }

    public void logout(HttpServletResponse res) {
        var c = props.getCookie();
        CookieUtil.expire(res, JwtProvider.ACCESS, c.getDomain(), c.isSecure(), c.getSameSite());
        CookieUtil.expire(res, JwtProvider.REFRESH, c.getDomain(), c.isSecure(), c.getSameSite());
    }


    @Transactional
    public UserDto loginWithGoogle(String idToken, String googleClientId, HttpServletResponse res) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(java.util.List.of(googleClientId))
                    .build();

            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google id_token");

            var payload = token.getPayload();
            String email   = payload.getEmail();
            String name    = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // 1) upsert: 이메일 기준으로 찾고 없으면 생성 (최소필드만)
            User u = userRepo.findByEmail(email).orElseGet(() -> {
                User created = User.builder()
                        .email(email)
                        // 소셜 계정이라도 비번 칼럼은 필요하니 더미값 인코딩
                        .password(encoder.encode("google:" + email))
                        .displayName((name == null || name.isBlank()) ? email : name)
                        .role(UserRole.USER)
                        .blocked(false)
                        .build();
                return userRepo.save(created);
            });

            // 3) JWT 쿠키 발급 (기존 로직 재사용)
            issueCookies(res, u);

            // 4) 응답 DTO
            return UserDto.from(u);

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google verify failed");
        }
    }
}
