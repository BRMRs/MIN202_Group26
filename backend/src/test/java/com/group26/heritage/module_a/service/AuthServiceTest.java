package com.group26.heritage.module_a.service;

import com.group26.heritage.common.exception.UnauthorizedException;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.common.security.JwtTokenProvider;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.LoginRequest;
import com.group26.heritage.module_a.dto.LoginResponse;
import com.group26.heritage.module_a.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRegisterRequest;
    private User savedUser;

    @BeforeEach
    void setUp() {
        validRegisterRequest = new RegisterRequest();
        validRegisterRequest.setUsername("testuser");
        validRegisterRequest.setEmail("test@example.com");
        validRegisterRequest.setPassword("Password1!");

        savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("testuser");
        savedUser.setEmail("test@example.com");
        savedUser.setPassword("$2a$encoded");
        savedUser.setRole(UserRole.VIEWER);
        savedUser.setEmailVerified(false);
    }

    // ─── register ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register - should create user with encoded password and default state")
    void register_ShouldCreateUser_WithEncodedPasswordAndDefaultState() {
        // Arrange
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        User result = authService.register(validRegisterRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getPassword()).isEqualTo("$2a$encoded");
        assertThat(result.getPassword()).isNotEqualTo("Password1!");
        assertThat(result.getRole()).isEqualTo(UserRole.VIEWER);
        assertThat(result.getEmailVerified()).isFalse();
        assertThat(result.getVerificationToken()).isNotBlank();
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register - should fail when email already exists")
    void register_ShouldThrow_WhenEmailAlreadyExists() {
        // Arrange
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register(validRegisterRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register - should fail when username already exists")
    void register_ShouldThrow_WhenUsernameAlreadyExists() {
        // Arrange
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register(validRegisterRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists");
        verify(userRepository, never()).save(any());
    }

    // ─── login ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login - should return JWT token when username and password are correct")
    void login_ShouldReturnJwtToken_WhenUsernameAndPasswordAreCorrect() {
        // Arrange
        LoginRequest req = new LoginRequest();
        req.setUsername("testuser");
        req.setPassword("Password1!");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("Password1!", "$2a$encoded")).thenReturn(true);
        when(jwtTokenProvider.generateToken(savedUser)).thenReturn("jwt.token.here");

        // Act
        LoginResponse response = authService.login(req);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt.token.here");
        assertThat(response.getToken()).isNotBlank();
    }

    @Test
    @DisplayName("login - should return correct user info in response")
    void login_ShouldReturnCorrectUserInfo_WhenCredentialsAreValid() {
        // Arrange
        LoginRequest req = new LoginRequest();
        req.setUsername("testuser");
        req.setPassword("Password1!");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(jwtTokenProvider.generateToken(any())).thenReturn("jwt.token.here");

        // Act
        LoginResponse response = authService.login(req);

        // Assert
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getRole()).isEqualTo("VIEWER");
    }

    @Test
    @DisplayName("login - should succeed when logging in with email instead of username")
    void login_ShouldSucceed_WhenUsingEmailAsIdentifier() {
        // Arrange
        LoginRequest req = new LoginRequest();
        req.setUsername("test@example.com"); // email used in username field
        req.setPassword("Password1!");

        when(userRepository.findByUsername("test@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("Password1!", "$2a$encoded")).thenReturn(true);
        when(jwtTokenProvider.generateToken(savedUser)).thenReturn("jwt.token.here");

        // Act
        LoginResponse response = authService.login(req);

        // Assert
        assertThat(response.getToken()).isNotBlank();
    }

    @Test
    @DisplayName("login - should throw UnauthorizedException when password is wrong")
    void login_ShouldThrowUnauthorized_WhenPasswordIsWrong() {
        // Arrange
        LoginRequest req = new LoginRequest();
        req.setUsername("testuser");
        req.setPassword("WrongPass1!");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(savedUser));
        when(passwordEncoder.matches("WrongPass1!", "$2a$encoded")).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("login - should throw UnauthorizedException when user does not exist")
    void login_ShouldThrowUnauthorized_WhenUserDoesNotExist() {
        // Arrange
        LoginRequest req = new LoginRequest();
        req.setUsername("nobody");
        req.setPassword("Password1!");

        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nobody")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid credentials");
    }

    // ─── verifyEmail ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyEmail - should mark email as verified and clear token")
    void verifyEmail_ShouldMarkEmailVerified_AndClearToken() {
        // Arrange
        User user = new User();
        user.setEmailVerified(false);
        user.setVerificationToken("valid-token-uuid");
        when(userRepository.findByVerificationToken("valid-token-uuid")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        authService.verifyEmail("valid-token-uuid");

        // Assert
        assertThat(user.getEmailVerified()).isTrue();
        assertThat(user.getVerificationToken()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("verifyEmail - should throw when token is invalid")
    void verifyEmail_ShouldThrow_WhenTokenIsInvalid() {
        // Arrange
        when(userRepository.findByVerificationToken("bad-token")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.verifyEmail("bad-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid verification token");
    }

    // ─── emailExists ─────────────────────────────────────────────────────────

    // ─── resetPassword ───────────────────────────────────────────────────────

    @Test
    @DisplayName("resetPassword - should update password when email exists")
    void resetPassword_ShouldUpdatePassword_WhenEmailExists() {
        // Arrange
        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword("$2a$old");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewPass1!")).thenReturn("$2a$new");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        authService.resetPassword("test@example.com", "NewPass1!");

        // Assert
        assertThat(user.getPassword()).isEqualTo("$2a$new");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("resetPassword - should throw when email does not exist")
    void resetPassword_ShouldThrow_WhenEmailDoesNotExist() {
        // Arrange
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.resetPassword("ghost@example.com", "NewPass1!"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No account found with that email");
    }

    // ─── loadUserByUsername ───────────────────────────────────────────────────

    @Test
    @DisplayName("loadUserByUsername - should return user when username exists")
    void loadUserByUsername_ShouldReturnUser_WhenUsernameExists() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(savedUser));
        assertThat(authService.loadUserByUsername("testuser")).isEqualTo(savedUser);
    }

    @Test
    @DisplayName("loadUserByUsername - should throw UsernameNotFoundException when user not found")
    void loadUserByUsername_ShouldThrow_WhenUserNotFound() {
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.loadUserByUsername("nobody"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
