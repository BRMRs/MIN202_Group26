package com.group26.heritage.common.security;

import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtTokenProvider Unit Tests")
class JwtTokenProviderTest {

    // 32+ byte secret required by HS256
    private static final String SECRET = "test-secret-key-must-be-at-least-32-bytes!!";
    private static final long EXPIRATION_MS = 3_600_000L; // 1 hour

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(SECRET, EXPIRATION_MS);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("$2a$encoded");
        testUser.setRole(UserRole.VIEWER);
    }

    // token generation tests

    @Test
    @DisplayName("generateToken - should return a token with three JWT segments")
    void generateToken_ShouldReturnWellFormedJwt() {
        String token = jwtTokenProvider.generateToken(testUser);

        assertThat(token.split("\\.")).hasSize(3);
    }

    // token parsing tests

    @Test
    @DisplayName("getUsernameFromToken - should extract correct username from token")
    void getUsernameFromToken_ShouldReturnCorrectUsername() {
        String token = jwtTokenProvider.generateToken(testUser);

        String username = jwtTokenProvider.getUsernameFromToken(token);

        assertThat(username).isEqualTo("testuser");
    }

    // token validation tests

    @Test
    @DisplayName("validateToken - should return true for a valid token")
    void validateToken_ShouldReturnTrue_ForValidToken() {
        String token = jwtTokenProvider.generateToken(testUser);

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("validateToken - should return false for a tampered token")
    void validateToken_ShouldReturnFalse_ForTamperedToken() {
        String token = jwtTokenProvider.generateToken(testUser);
        String tampered = token.substring(0, token.length() - 4) + "XXXX";

        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("validateToken - should return false for token signed with different secret")
    void validateToken_ShouldReturnFalse_ForTokenSignedWithDifferentSecret() {
        JwtTokenProvider otherProvider = new JwtTokenProvider(
                "completely-different-secret-key-32bytes!!", EXPIRATION_MS);
        String foreignToken = otherProvider.generateToken(testUser);

        assertThat(jwtTokenProvider.validateToken(foreignToken)).isFalse();
    }

    @Test
    @DisplayName("validateToken - should return false for an expired token")
    void validateToken_ShouldReturnFalse_ForExpiredToken() {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(SECRET, -1L);
        String expiredToken = shortLivedProvider.generateToken(testUser);

        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }
}
