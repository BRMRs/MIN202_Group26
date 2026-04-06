package com.group26.heritage.module_a.controller;

import com.group26.heritage.module_a.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        String token = authService.login(username, password);
        Long userId = authService.getUserId(token);
        var role = authService.getUserRole(token);
        return ResponseEntity.ok(Map.of(
            "token", token,
            "userId", userId,
            "username", username,
            "role", role.name()
        ));
    }
}