package org.example.myproject.security;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "security.jwt")
public class JwtProperties {
    // getters/setters
    private String secretBase64;
    private long accessValidSeconds;
    private long refreshValidSeconds;
    private Cookie cookie = new Cookie();

    @Setter
    @Getter
    public static class Cookie {
        // getters/setters
        private String domain;
        private boolean secure;
        private String sameSite; // Lax/Strict/None

    }

}

