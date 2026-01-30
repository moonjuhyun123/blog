package org.example.myproject.config;

import jakarta.servlet.http.Cookie;
import org.example.myproject.repository.user.UserRepository;
import org.example.myproject.security.JwtProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtProvider jwtProvider,
                                          UserRepository userRepository) throws Exception {
        http
                .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration cfg = new CorsConfiguration();
                    cfg.setAllowCredentials(true);
                    cfg.setAllowedOriginPatterns(List.of("*"));
                    cfg.setAllowedMethods(List.of("GET","POST","PATCH","PUT","DELETE","OPTIONS"));
                    cfg.setAllowedHeaders(List.of("*"));
                    return cfg;
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**","/swagger-ui/**","/swagger-ui.html","/h2-console/**","/uploads/**",    // ✅ 추가: React 정적 리소스
                                "/",                 // index.html
                                "/index.html",
                                "/assets/**",        // Vite 빌드 파일(js, css 등)
                                "/favicon.ico",
                                "/manifest.webmanifest",
                                "/robots.txt").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Preflight
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/register","/api/auth/login","/api/auth/google","/api/auth/refresh",
                                "/api/ping","/api/analytics/visit").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/categories","/api/categories/summary","/api/posts","/api/categories/*/posts","/api/posts/*","/api/posts/pinned",
                                "/api/news","/api/news/*","/api/news/*/comments").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable);

        // 🔑 쿠키의 ACCESS_TOKEN으로 인증 세팅
        http.addFilterBefore(new JwtAuthFilter(jwtProvider, userRepository),
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}

