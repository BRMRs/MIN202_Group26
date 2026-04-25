package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_a.dto.LoginRequest;
import com.group26.heritage.module_a.dto.LoginResponse;
import com.group26.heritage.module_a.dto.RegisterRequest;
import com.group26.heritage.module_a.dto.SendCodeRequest;
import com.group26.heritage.module_a.dto.VerifyCodeRequest;
import com.group26.heritage.module_a.service.AuthService;
import com.group26.heritage.module_a.service.EmailVerificationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/register")
    public ApiResponse<User> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ApiResponse.success("Registration successful", user);
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }

    @GetMapping("/verify-email")
    public ApiResponse<Void> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ApiResponse.success("Email verified successfully", null);
    }

    @PostMapping("/send-code")
    public ApiResponse<Void> sendCode(@Valid @RequestBody SendCodeRequest request) {
        if (authService.emailExists(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        emailVerificationService.sendCode(request.getEmail());
        return ApiResponse.success("Verification code sent", null);
    }

    @PostMapping("/verify-code-and-register")
    public ApiResponse<User> verifyCodeAndRegister(@Valid @RequestBody VerifyCodeRequest request) {
        if (!emailVerificationService.verifyCode(request.getEmail(), request.getCode())) {
            throw new IllegalArgumentException("Invalid verification code");
        }
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername(request.getUsername());
        reg.setEmail(request.getEmail());
        reg.setPassword(request.getPassword());
        User user = authService.register(reg);
        return ApiResponse.success("Registration successful", user);
    }
}

