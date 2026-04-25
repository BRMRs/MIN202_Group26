package com.group26.heritage.module_a.service;

import com.group26.heritage.common.exception.UnauthorizedException;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.common.security.JwtTokenProvider;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.LoginRequest;
import com.group26.heritage.module_a.dto.LoginResponse;
import com.group26.heritage.module_a.dto.RegisterRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.VIEWER);
        user.setEmailVerified(false);
        user.setVerificationToken(UUID.randomUUID().toString());
        return userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        // Try to find user by username first, then by email
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        String token = jwtTokenProvider.generateToken(user);
        return new LoginResponse(token, user.getUsername(), user.getEmail(), user.getRole().name());
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
}
