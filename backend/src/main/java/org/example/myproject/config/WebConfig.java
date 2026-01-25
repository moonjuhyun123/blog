package org.example.myproject.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 루트
        registry.addViewController("/").setViewName("forward:/index.html");

        // SPA 라우팅: 첫 세그먼트가 api, v3, swagger-ui, h2-console, uploads 가 아닌 경우에만
        // 확장자(.) 없는 경로를 index.html 로 포워드
        registry.addViewController("/{a:^(?!api$|v3$|swagger-ui$|h2-console$|uploads$)[^\\.]+}")
                .setViewName("forward:/index.html");
        registry.addViewController("/{a:^(?!api$|v3$|swagger-ui$|h2-console$|uploads$)[^\\.]+}/{b:[^\\.]+}")
                .setViewName("forward:/index.html");
        registry.addViewController("/{a:^(?!api$|v3$|swagger-ui$|h2-console$|uploads$)[^\\.]+}/{b:[^\\.]+}/{c:[^\\.]+}")
                .setViewName("forward:/index.html");
        registry.addViewController("/{a:^(?!api$|v3$|swagger-ui$|h2-console$|uploads$)[^\\.]+}/{b:[^\\.]+}/{c:[^\\.]+}/{d:[^\\.]+}")
                .setViewName("forward:/index.html");
        registry.addViewController("/{a:^(?!api$|v3$|swagger-ui$|h2-console$|uploads$)[^\\.]+}/{b:[^\\.]+}/{c:[^\\.]+}/{d:[^\\.]+}/{e:[^\\.]+}")
                .setViewName("forward:/index.html");
    }
}

