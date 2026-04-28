package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.config.SecurityConfig;
import com.group26.heritage.common.exception.GlobalExceptionHandler;
import com.group26.heritage.common.exception.UnauthorizedException;
import com.group26.heritage.common.security.JwtAuthenticationFilter;
import com.group26.heritage.common.security.JwtTokenProvider;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.LoginRequest;
import com.group26.heritage.module_a.dto.LoginResponse;
import com.group26.heritage.module_a.service.AuthService;
import com.group26.heritage.module_a.service.EmailVerificationService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@DisplayName("AuthController Integration Tests (MockMvc)")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private EmailVerificationService emailVerificationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private User savedUser;

    @BeforeEach
    void setUp() throws Exception {
        // Allow the mock filter to pass requests through to the controller
        doAnswer(inv -> {
            jakarta.servlet.FilterChain chain = inv.getArgument(2);
            chain.doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());

        savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("testuser");
        savedUser.setEmail("test@example.com");
        savedUser.setPassword("$2a$encoded");
        savedUser.setRole(UserRole.VIEWER);
        savedUser.setEmailVerified(false);
    }

    // ─── POST /api/auth/register ──────────────────────────────────────────────

    @Test
    @DisplayName("register - should return 200 when registration succeeds")
    void register_ShouldReturn200_WhenRegistrationSucceeds() throws Exception {
        when(authService.register(any())).thenReturn(savedUser);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"testuser","email":"test@example.com","password":"Password1!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful"));
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────────

    @Test
    @DisplayName("login - should return 200 with JWT token on valid credentials")
    void login_ShouldReturn200WithToken_WhenCredentialsAreValid() throws Exception {
        LoginResponse loginResponse = new LoginResponse("jwt.token.here", "testuser", "test@example.com", "VIEWER");
        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"testuser","password":"Password1!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("jwt.token.here"))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.role").value("VIEWER"));
    }

    @Test
    @DisplayName("login - should return 401 when credentials are invalid")
    void login_ShouldReturn401_WhenCredentialsAreInvalid() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new UnauthorizedException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"testuser","password":"WrongPass1!"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    // ─── GET /api/auth/verify-email ───────────────────────────────────────────

    // ─── POST /api/auth/send-code ─────────────────────────────────────────────

    @Test
    @DisplayName("sendCode - should return 200 when email is new")
    void sendCode_ShouldReturn200_WhenEmailIsNew() throws Exception {
        when(authService.emailExists("new@example.com")).thenReturn(false);
        doNothing().when(emailVerificationService).sendCode("new@example.com");

        mockMvc.perform(post("/api/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Verification code sent"));
    }

    @Test
    @DisplayName("sendCode - should return 400 when email already exists")
    void sendCode_ShouldReturn400_WhenEmailAlreadyExists() throws Exception {
        when(authService.emailExists("existing@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"existing@example.com"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("sendCode - should return 400 when email format is invalid")
    void sendCode_ShouldReturn400_WhenEmailFormatIsInvalid() throws Exception {
        mockMvc.perform(post("/api/auth/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ─── POST /api/auth/verify-code-and-register ─────────────────────────────

    @Test
    @DisplayName("verifyCodeAndRegister - should return 200 when code is correct")
    void verifyCodeAndRegister_ShouldReturn200_WhenCodeIsCorrect() throws Exception {
        when(emailVerificationService.verifyCode("test@example.com", "123456")).thenReturn(true);
        when(authService.register(any())).thenReturn(savedUser);

        mockMvc.perform(post("/api/auth/verify-code-and-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"testuser","email":"test@example.com","password":"Password1!","code":"123456"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful"));
    }

    @Test
    @DisplayName("verifyCodeAndRegister - should return 400 when code is wrong")
    void verifyCodeAndRegister_ShouldReturn400_WhenCodeIsWrong() throws Exception {
        when(emailVerificationService.verifyCode("test@example.com", "000000")).thenReturn(false);

        mockMvc.perform(post("/api/auth/verify-code-and-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"testuser","email":"test@example.com","password":"Password1!","code":"000000"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ─── POST /api/auth/send-reset-code ──────────────────────────────────────

    // ─── POST /api/auth/verify-reset-code ────────────────────────────────────

    // ─── POST /api/auth/reset-password ───────────────────────────────────────

    @Test
    @DisplayName("resetPassword - should return 200 when code is valid and password is reset")
    void resetPassword_ShouldReturn200_WhenCodeIsValidAndPasswordIsReset() throws Exception {
        when(emailVerificationService.verifyResetCode("test@example.com", "654321")).thenReturn(true);
        doNothing().when(authService).resetPassword("test@example.com", "NewPass1!");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@example.com","code":"654321","newPassword":"NewPass1!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));
    }

    @Test
    @DisplayName("resetPassword - should return 400 when reset code is invalid")
    void resetPassword_ShouldReturn400_WhenResetCodeIsInvalid() throws Exception {
        when(emailVerificationService.verifyResetCode("test@example.com", "000000")).thenReturn(false);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@example.com","code":"000000","newPassword":"NewPass1!"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
