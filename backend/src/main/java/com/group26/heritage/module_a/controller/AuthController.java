package com.group26.heritage.module_a.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication Controller — Module A
 * Summary A-PBI 1.1 (Registration), A-PBI 1.2 (Login), A-PBI 1.3 (Logout)
 *
 * TODO: POST /api/auth/register — register new user (A-PBI 1.1)
 * TODO: POST /api/auth/login — authenticate and return JWT token (A-PBI 1.2)
 * TODO: POST /api/auth/logout — invalidate JWT token (A-PBI 1.3)
 * TODO: GET /api/auth/verify-email?token= — verify email address (A-PBI 1.1)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // TODO: inject AuthService
    // TODO: implement endpoints
}
