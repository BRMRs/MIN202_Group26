package com.group26.heritage.module_a.service;

import org.springframework.stereotype.Service;

/**
 * Authentication Service — Module A
 * TODO: Inject UserRepository, JwtTokenProvider, PasswordEncoder
 * TODO: register(RegisterRequest) — validate uniqueness, hash password, save user, send verification email
 * TODO: login(LoginRequest) → String JWT — validate credentials, generate token
 * TODO: logout(String token) — invalidate token (blacklist or token versioning)
 * TODO: validateToken(String token) → boolean
 * TODO: sendVerificationEmail(User user) — send email with verification link
 */
@Service
public class AuthService {
    // TODO: implement authentication logic
}
