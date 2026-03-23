package com.group26.heritage.common.config;

import org.springframework.context.annotation.Configuration;

/**
 * Spring Security Configuration
 * Module A: Configure JWT filter chain (Summary A-PBI 1.2)
 *
 * TODO: Add @EnableWebSecurity
 * TODO: Inject JwtAuthenticationFilter
 * TODO: Configure SecurityFilterChain bean:
 *   - Disable CSRF for REST API
 *   - Set session management to STATELESS
 *   - Configure public endpoints: /api/auth/**, /api/discover/**
 *   - Require authentication for all other endpoints
 *   - Add JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter
 * TODO: Configure PasswordEncoder bean (BCryptPasswordEncoder)
 * TODO: Configure AuthenticationManager bean
 */
@Configuration
public class SecurityConfig {
    // TODO: implement security configuration
}
