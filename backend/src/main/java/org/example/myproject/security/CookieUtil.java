package org.example.myproject.security;


import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    public static void addHttpOnlyCookie(
            HttpServletResponse res, String name, String value,
            String domain, boolean secure, String sameSite, long maxAgeSeconds
    ) {
        Cookie c = new Cookie(name, value);
        c.setHttpOnly(true);
        c.setSecure(secure);
        c.setPath("/");
        if (domain != null && !domain.isBlank()) c.setDomain(domain);
        c.setMaxAge((int) maxAgeSeconds);
        res.addHeader("Set-Cookie",
                cookieHeader(c) + "; SameSite=" + (sameSite == null ? "Lax" : sameSite));
    }

    private static String cookieHeader(Cookie c) {
        return c.getName() + "=" + c.getValue()
                + "; Path=" + c.getPath()
                + (c.getDomain() != null ? "; Domain=" + c.getDomain() : "")
                + (c.getSecure() ? "; Secure" : "")
                + "; HttpOnly"
                + "; Max-Age=" + c.getMaxAge();
    }

    public static void expire(HttpServletResponse res, String name, String domain, boolean secure, String sameSite) {
        addHttpOnlyCookie(res, name, "", domain, secure, sameSite, 0);
    }
}

