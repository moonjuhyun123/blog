package org.example.myproject.security;


import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Component;

@Component
public class JwtProvider {

    private final Key key;
    private final JwtProperties props;

    public static final String ACCESS = "ACCESS_TOKEN";
    public static final String REFRESH = "REFRESH_TOKEN";

    public JwtProvider(JwtProperties props) {
        this.props = props;
        byte[] secretBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(props.getSecretBase64().replaceAll("\\s+",""));
        this.key = Keys.hmacShaKeyFor(secretBytes); // HS512 지원되는 길이
    }

    public String createAccessToken(Long userId, String role, long nowSec) {
        long exp = nowSec + props.getAccessValidSeconds();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .addClaims(Map.of("role", role, "typ", "access"))
                .setIssuedAt(new Date(nowSec * 1000))
                .setExpiration(new Date(exp * 1000))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public String createRefreshToken(Long userId, long nowSec) {
        long exp = nowSec + props.getRefreshValidSeconds();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .addClaims(Map.of("typ", "refresh"))
                .setIssuedAt(new Date(nowSec * 1000))
                .setExpiration(new Date(exp * 1000))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }

    public <T> T extract(String token, Function<Claims, T> f) {
        return f.apply(parse(token).getBody());
    }

    public Long getUserId(String token) { return Long.valueOf(extract(token, Claims::getSubject)); }
    public String getRole(String token) { return (String) extract(token, c -> c.get("role")); }
    public boolean isAccess(String token){ return "access".equals(extract(token, c -> c.get("typ"))); }
    public boolean isRefresh(String token){ return "refresh".equals(extract(token, c -> c.get("typ"))); }
}

