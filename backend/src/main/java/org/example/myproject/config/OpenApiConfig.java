package org.example.myproject.config;


import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CSR Mini Board API")
                        .version("1.0.0")
                        .description("JWT(HttpOnly Cookie) 기반 CSR 게시판 백엔드 API 명세"))
                // ✅ 이 부분이 바로 components.securitySchemes 등록
                .components(new Components().addSecuritySchemes(
                        "JWT", // name: Swagger에서 사용하는 인증 이름
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("ACCESS_TOKEN") // 네 Access Token 쿠키 이름
                ));
    }
}


