package com.group26.heritage.common;

import com.group26.heritage.entity.enums.UserRole;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private record DemoUser(Long userId, String username, String password, UserRole role) {}
    private record UserSession(Long userId, String username, UserRole role) {}

    private static final Map<String, DemoUser> USERS = Map.of(
            "contributor", new DemoUser(1001L, "contributor", "123456", UserRole.CONTRIBUTOR),
            "viewer",      new DemoUser(2001L, "viewer",      "123456", UserRole.VIEWER),
            "admin",       new DemoUser(3001L, "admin",       "123456", UserRole.ADMIN)
    );

    private final Map<String, UserSession> sessions = new ConcurrentHashMap<>();

    public record LoginRequest(String username, String password) {}
    public record LoginResponse(String token, Long userId, String username, UserRole role) {}

    public LoginResponse login(LoginRequest request) {
        if (request == null || isBlank(request.username()) || isBlank(request.password()))
            throw new IllegalArgumentException("用户名和密码不能为空");
        DemoUser user = USERS.get(request.username());
        if (user == null || !user.password().equals(request.password()))
            throw new IllegalStateException("用户名或密码错误");
        String token = UUID.randomUUID().toString();
        sessions.put(token, new UserSession(user.userId(), user.username(), user.role()));
        return new LoginResponse(token, user.userId(), user.username(), user.role());
    }

    public UserSession requireSession(String token) {
        if (isBlank(token)) throw new IllegalStateException("请先登录");
        UserSession s = sessions.get(token);
        if (s == null) throw new IllegalStateException("登录已失效，请重新登录");
        return s;
    }

    public Long getUserId(String token) { return requireSession(token).userId(); }
    public UserRole getUserRole(String token) { return requireSession(token).role(); }

    private boolean isBlank(String v) { return v == null || v.trim().isEmpty(); }
}
