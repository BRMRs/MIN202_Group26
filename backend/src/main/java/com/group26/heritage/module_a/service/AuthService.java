package com.group26.heritage.module_a.service;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private record UserSession(Long userId, String username, com.group26.heritage.entity.enums.UserRole role) {}

    private static final java.util.Map<String, UserSession> SESSIONS = new java.util.concurrent.ConcurrentHashMap<>();

    static {
        SESSIONS.put("contributor", new UserSession(3L, "contributor", com.group26.heritage.entity.enums.UserRole.CONTRIBUTOR));
        SESSIONS.put("viewer", new UserSession(3L, "viewer", com.group26.heritage.entity.enums.UserRole.VIEWER));
        SESSIONS.put("admin", new UserSession(1L, "admin", com.group26.heritage.entity.enums.UserRole.ADMIN));
    }

    public String login(String username, String password) {
        UserSession user = SESSIONS.get(username);
        if (user == null || !password.equals("123456")) {
            throw new IllegalStateException("用户名或密码错误");
        }
        String token = java.util.UUID.randomUUID().toString();
        SESSIONS.put(token, user);
        return token;
    }

    public Long getUserId(String token) {
        UserSession s = SESSIONS.get(token);
        if (s == null) throw new IllegalStateException("登录已失效");
        return s.userId();
    }

    public com.group26.heritage.entity.enums.UserRole getUserRole(String token) {
        UserSession s = SESSIONS.get(token);
        if (s == null) throw new IllegalStateException("登录已失效");
        return s.role();
    }
}
