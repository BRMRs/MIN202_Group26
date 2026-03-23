package com.group26.heritage.common.security;

import org.springframework.stereotype.Component;

/**
 * JWT Token Provider
 * Module A: JWT token generation and validation (Summary A-PBI 1.2)
 *
 * TODO: Inject jwt.secret and jwt.expiration from application.properties
 * TODO: Implement generateToken(UserDetails userDetails) → String
 * TODO: Implement validateToken(String token) → boolean
 * TODO: Implement getUserIdFromToken(String token) → Long
 * TODO: Implement getUsernameFromToken(String token) → String
 * TODO: Implement getExpirationDateFromToken(String token) → Date
 */
@Component
public class JwtTokenProvider {
    // TODO: implement JWT token provider
}
