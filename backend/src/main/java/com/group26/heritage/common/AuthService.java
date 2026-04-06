package com.group26.heritage.common;

import com.group26.heritage.entity.enums.UserRole;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private record UserSession(Long userId, String username, UserRole role) {}

    private static final Map<String, UserSession> SESSIONS = new ConcurrentHashMap<>();

    static {
        SESSIONS.put("contributor", new UserSession(1001L, "contributor", UserRole.CONTRIBUTOR));
        SESSIONS.put("viewer", new UserSession(2001L, "viewer", UserRole.VIEWER));
        SESSIONS.put("admin", new UserSession(3001L, "admin", UserRole.ADMIN));
    }

    public String login(String username, String password) {
        UserSession user = SESSIONS.get(username);
        if (user == null || !password.equals("123456")) {
            throw new IllegalStateException("用户名或密码错误");
        }
        String token = UUID.randomUUID().toString();
        SESSIONS.put(token, user);
        return token;
    }

    public Long getUserId(String token) {
        UserSession s = SESSIONS.get(token);
        if (s == null) throw new IllegalStateException("登录已失效");
        return s.userId();
    }

    public UserRole getUserRole(String token) {
        UserSession s = SESSIONS.get(token);
        if (s == null) throw new IllegalStateException("登录已失效");
        return s.role();
    }
}