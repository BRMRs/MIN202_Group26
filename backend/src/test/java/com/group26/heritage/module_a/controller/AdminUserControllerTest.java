package com.group26.heritage.module_a.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group26.heritage.common.config.SecurityConfig;
import com.group26.heritage.common.exception.GlobalExceptionHandler;
import com.group26.heritage.common.security.JwtAuthenticationFilter;
import com.group26.heritage.common.security.JwtTokenProvider;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ApplicationStatus;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.ContributorApplicationDetailResponse;
import com.group26.heritage.module_a.dto.ContributorApplicationListResponse;
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
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AdminUserController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@DisplayName("AdminUserController Integration Tests (MockMvc)")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User viewerUser;

    @BeforeEach
    void setUp() throws Exception {
        doAnswer(inv -> {
            jakarta.servlet.FilterChain chain = inv.getArgument(2);
            chain.doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());

        adminUser = new User();
        adminUser.setId(99L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("$2a$encoded");
        adminUser.setRole(UserRole.ADMIN);

        viewerUser = new User();
        viewerUser.setId(1L);
        viewerUser.setUsername("viewer");
        viewerUser.setEmail("viewer@example.com");
        viewerUser.setPassword("$2a$encoded");
        viewerUser.setRole(UserRole.VIEWER);
    }

    // ─── GET /api/admin/users/applications ────────────────────────────────────

    @Test
    @DisplayName("getApplications - admin should get all applications")
    void getApplications_ShouldReturn200WithList_WhenCalledByAdmin() throws Exception {
        ContributorApplicationListResponse item = new ContributorApplicationListResponse();
        item.setId(1L);
        item.setUserId(1L);
        item.setUsername("viewer");
        item.setStatus(ApplicationStatus.PENDING);
        item.setAppliedAt(LocalDateTime.now());

        when(userService.getApplicationsList()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/admin/users/applications").with(user(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].username").value("viewer"))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("getApplications - should return 403 when called by non-admin")
    void getApplications_ShouldReturn403_WhenCalledByNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users/applications").with(user(viewerUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("getApplications - should return 401 when not authenticated")
    void getApplications_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/users/applications"))
                .andExpect(status().isUnauthorized());
    }

    // ─── GET /api/admin/users/applications/{id} ───────────────────────────────

    @Test
    @DisplayName("getApplicationDetail - admin should get application detail")
    void getApplicationDetail_ShouldReturn200WithDetail_WhenCalledByAdmin() throws Exception {
        ContributorApplicationDetailResponse detail = new ContributorApplicationDetailResponse();
        detail.setId(5L);
        detail.setUserId(1L);
        detail.setUsername("viewer");
        detail.setEmail("viewer@example.com");
        detail.setStatus(ApplicationStatus.PENDING);
        detail.setReason("I want to contribute");
        detail.setAppliedAt(LocalDateTime.now());
        detail.setFiles(Collections.emptyList());

        when(userService.getApplicationDetail(5L)).thenReturn(detail);

        mockMvc.perform(get("/api/admin/users/applications/5").with(user(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(5))
                .andExpect(jsonPath("$.data.username").value("viewer"))
                .andExpect(jsonPath("$.data.reason").value("I want to contribute"));
    }

    @Test
    @DisplayName("getApplicationDetail - should return 403 when called by non-admin")
    void getApplicationDetail_ShouldReturn403_WhenCalledByNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users/applications/5").with(user(viewerUser)))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /api/admin/users/applications/{id}/approve ──────────────────────

    @Test
    @DisplayName("approveApplication - admin should approve application")
    void approveApplication_ShouldReturn200_WhenCalledByAdmin() throws Exception {
        doNothing().when(userService).approveApplication(5L, 99L);

        mockMvc.perform(put("/api/admin/users/applications/5/approve").with(user(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Application approved"));

        verify(userService).approveApplication(5L, 99L);
    }

    @Test
    @DisplayName("approveApplication - should return 403 when called by non-admin")
    void approveApplication_ShouldReturn403_WhenCalledByNonAdmin() throws Exception {
        mockMvc.perform(put("/api/admin/users/applications/5/approve").with(user(viewerUser)))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /api/admin/users/applications/{id}/reject ───────────────────────

    @Test
    @DisplayName("rejectApplication - admin should reject application with reason")
    void rejectApplication_ShouldReturn200_WhenCalledByAdminWithReason() throws Exception {
        doNothing().when(userService).rejectApplication(5L, 99L, "Insufficient evidence");

        mockMvc.perform(put("/api/admin/users/applications/5/reject")
                        .with(user(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":"Insufficient evidence"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Application rejected"));

        verify(userService).rejectApplication(5L, 99L, "Insufficient evidence");
    }

    @Test
    @DisplayName("rejectApplication - should return 400 when reason is blank")
    void rejectApplication_ShouldReturn400_WhenReasonIsBlank() throws Exception {
        mockMvc.perform(put("/api/admin/users/applications/5/reject")
                        .with(user(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("rejectApplication - should return 400 when reason exceeds 1000 chars")
    void rejectApplication_ShouldReturn400_WhenReasonExceedsMaxLength() throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of("reason", "A".repeat(1001)));

        mockMvc.perform(put("/api/admin/users/applications/5/reject")
                        .with(user(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("rejectApplication - should return 403 when called by non-admin")
    void rejectApplication_ShouldReturn403_WhenCalledByNonAdmin() throws Exception {
        mockMvc.perform(put("/api/admin/users/applications/5/reject")
                        .with(user(viewerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":"Not enough info"}
                                """))
                .andExpect(status().isForbidden());
    }
}
