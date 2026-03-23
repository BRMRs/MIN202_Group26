package com.group26.heritage.common.security;

import org.springframework.stereotype.Component;

/**
 * JWT Authentication Filter
 * Module A: Intercept requests and validate JWT tokens (Summary A-PBI 1.2)
 *
 * TODO: Extend OncePerRequestFilter
 * TODO: Extract JWT from Authorization header (Bearer token)
 * TODO: Validate token using JwtTokenProvider
 * TODO: Set SecurityContextHolder authentication if token is valid
 * TODO: Handle token expiration and invalid token exceptions
 */
@Component
public class JwtAuthenticationFilter {
    // TODO: extend OncePerRequestFilter and implement doFilterInternal
}
