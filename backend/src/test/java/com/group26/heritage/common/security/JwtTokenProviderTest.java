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

    // ─── generateToken ────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateToken - should return a non-blank token")
    void generateToken_ShouldReturnNonBlankToken() {
        String token = jwtTokenProvider.generateToken(testUser);
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("generateToken - should return a token with three JWT segments")
    void generateToken_ShouldReturnWellFormedJwt() {
        String token = jwtTokenProvider.generateToken(testUser);
        // JWT format: header.payload.signature
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("generateToken - two tokens for same user should differ (different iat)")
    void generateToken_ShouldProduceDifferentTokens_OnSubsequentCalls() throws InterruptedException {
        String token1 = jwtTokenProvider.generateToken(testUser);
        // JWT iat is second-precision; sleep >1 s to guarantee a different timestamp
        Thread.sleep(1100);
        String token2 = jwtTokenProvider.generateToken(testUser);
        assertThat(token1).isNotEqualTo(token2);
    }

    // ─── getUsernameFromToken ─────────────────────────────────────────────────

    @Test
    @DisplayName("getUsernameFromToken - should extract correct username from token")
    void getUsernameFromToken_ShouldReturnCorrectUsername() {
        String token = jwtTokenProvider.generateToken(testUser);
        String username = jwtTokenProvider.getUsernameFromToken(token);
        assertThat(username).isEqualTo("testuser");
    }

    @Test
    @DisplayName("getUsernameFromToken - should throw when token is invalid")
    void getUsernameFromToken_ShouldThrow_WhenTokenIsInvalid() {
        assertThatThrownBy(() -> jwtTokenProvider.getUsernameFromToken("not.a.valid.token"))
                .isInstanceOf(Exception.class);
    }

    // ─── validateToken ────────────────────────────────────────────────────────

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
    @DisplayName("validateToken - should return false for a completely invalid string")
    void validateToken_ShouldReturnFalse_ForGarbageInput() {
        assertThat(jwtTokenProvider.validateToken("garbage.token.value")).isFalse();
    }

    @Test
    @DisplayName("validateToken - should return false for an empty string")
    void validateToken_ShouldReturnFalse_ForEmptyString() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
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
        // Create provider with -1ms expiration so token is immediately expired
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(SECRET, -1L);
        String expiredToken = shortLivedProvider.generateToken(testUser);
        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }

    // ─── round-trip ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("round-trip - username extracted from generated token should match original")
    void roundTrip_UsernameShouldMatchAfterGenerateAndExtract() {
        String token = jwtTokenProvider.generateToken(testUser);
        String extracted = jwtTokenProvider.getUsernameFromToken(token);
        assertThat(extracted).isEqualTo(testUser.getUsername());
    }
}
