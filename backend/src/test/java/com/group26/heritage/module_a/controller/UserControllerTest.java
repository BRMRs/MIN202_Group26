package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.config.SecurityConfig;
import com.group26.heritage.common.exception.GlobalExceptionHandler;
import com.group26.heritage.common.security.JwtAuthenticationFilter;
import com.group26.heritage.common.security.JwtTokenProvider;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ApplicationStatus;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.UserProfileResponse;
import com.group26.heritage.module_a.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@DisplayName("UserController Integration Tests (MockMvc)")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private User authenticatedUser;
    private UserProfileResponse profileResponse;

    @BeforeEach
    void setUp() throws Exception {
        doAnswer(inv -> {
            jakarta.servlet.FilterChain chain = inv.getArgument(2);
            chain.doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());

        authenticatedUser = new User();
        authenticatedUser.setId(1L);
        authenticatedUser.setUsername("testuser");
        authenticatedUser.setEmail("test@example.com");
        authenticatedUser.setPassword("$2a$encoded");
        authenticatedUser.setRole(UserRole.VIEWER);
        authenticatedUser.setEmailVerified(true);

        profileResponse = new UserProfileResponse(
                1L, "testuser", "test@example.com", "VIEWER",
                null, "My bio", true,
                LocalDateTime.now(), LocalDateTime.now(),
                null, null, null
        );
    }

    // ─── GET /api/users/me ────────────────────────────────────────────────────

    @Test
    @DisplayName("getProfile - should return 200 with profile for authenticated user")
    void getProfile_ShouldReturn200_WhenUserIsAuthenticated() throws Exception {
        when(userService.getProfileWithStatus(1L)).thenReturn(profileResponse);

        mockMvc.perform(get("/api/users/me").with(user(authenticatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.role").value("VIEWER"));
    }

    @Test
    @DisplayName("getProfile - should deny unauthenticated access")
    void getProfile_ShouldReturn401_WhenUserIsNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().is4xxClientError());
    }

    // ─── PUT /api/users/profile ───────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile - should return 200 when profile update succeeds")
    void updateProfile_ShouldReturn200_WhenUpdateSucceeds() throws Exception {
        User updated = new User();
        updated.setId(1L);
        updated.setUsername("newname");
        updated.setEmail("test@example.com");
        updated.setRole(UserRole.VIEWER);

        when(userService.updateProfile(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/users/profile")
                        .with(user(authenticatedUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"newname"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile updated"));
    }

    @Test
    @DisplayName("updateProfile - should return 400 when username is already taken")
    void updateProfile_ShouldReturn400_WhenUsernameAlreadyTaken() throws Exception {
        when(userService.updateProfile(eq(1L), any()))
                .thenThrow(new IllegalArgumentException("Username already exists"));

        mockMvc.perform(put("/api/users/profile")
                        .with(user(authenticatedUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"takenname"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Username already exists"));
    }

    @Test
    @DisplayName("updateProfile - should deny unauthenticated access")
    void updateProfile_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"newname"}
                                """))
                .andExpect(status().is4xxClientError());
    }

    // ─── POST /api/users/apply-contributor ───────────────────────────────────

    @Test
    @DisplayName("applyContributor - should return 200 when application is submitted")
    void applyContributor_ShouldReturn200_WhenApplicationSubmitted() throws Exception {
        com.group26.heritage.entity.ContributorApplication app =
                new com.group26.heritage.entity.ContributorApplication();
        app.setId(1L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);

        when(userService.applyForContributor(eq(1L), eq("I want to contribute"), any()))
                .thenReturn(app);

        mockMvc.perform(multipart("/api/users/apply-contributor")
                        .param("reason", "I want to contribute")
                        .with(user(authenticatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Application submitted"));
    }

    @Test
    @DisplayName("applyContributor - should return 400 when application already pending")
    void applyContributor_ShouldReturn400_WhenApplicationAlreadyPending() throws Exception {
        when(userService.applyForContributor(eq(1L), any(), any()))
                .thenThrow(new IllegalArgumentException("Application already pending"));

        mockMvc.perform(multipart("/api/users/apply-contributor")
                        .param("reason", "I want to contribute")
                        .with(user(authenticatedUser)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("applyContributor - should deny unauthenticated access")
    void applyContributor_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(multipart("/api/users/apply-contributor")
                        .param("reason", "I want to contribute"))
                .andExpect(status().is4xxClientError());
    }
}
