package org.example.myproject.controller;


import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.myproject.dto.common.IdOnly;
import org.example.myproject.dto.user.GoogleLoginRequest;
import org.example.myproject.dto.user.LoginRequest;
import org.example.myproject.dto.user.RegisterRequest;
import org.example.myproject.dto.user.UserDto;
import org.example.myproject.entity.user.User;
import org.example.myproject.security.CookieUtil;
import org.example.myproject.security.JwtProvider;
import org.example.myproject.service.AuthService;
import org.example.myproject.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SecurityRequirement(name = "JWT")
@RestController @RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        var user = auth.register(req);
        // 스펙: 201에 {id} 혹은 {user}. 여기선 {id} 응답
        return ResponseEntity.status(201).body(new IdOnly(user.id()));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody LoginRequest req, HttpServletResponse res) {
        return ResponseEntity.ok(auth.login(req, res));
    }

    @Value("${app.google.client-id}")
    private String googleClientId;

    @PostMapping(value = "/google", produces = "application/json")
    public UserDto google(@Valid @RequestBody GoogleLoginRequest req,
                          HttpServletResponse res) {
        return auth.loginWithGoogle(req.idToken(), googleClientId, res);
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse res) {
        String rt = null;
        if (request.getCookies()!=null) {
            for (Cookie c: request.getCookies()) if (JwtProvider.REFRESH.equals(c.getName())) rt = c.getValue();
        }
        if (rt == null) return ResponseEntity.status(401).build();
        auth.refresh(rt, res);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse res) {
        auth.logout(res);
        return ResponseEntity.noContent().build();
    }
}

