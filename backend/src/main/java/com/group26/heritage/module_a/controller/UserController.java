package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_a.dto.ContributorApplyRequest;
import com.group26.heritage.module_a.dto.ProfileUpdateRequest;
import com.group26.heritage.module_a.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<User> getProfile(@AuthenticationPrincipal User user) {
        User profile = userService.getProfile(user.getId());
        return ApiResponse.success(profile);
    }

    @PutMapping("/profile")
    public ApiResponse<User> updateProfile(@AuthenticationPrincipal User user,
                                           @RequestBody ProfileUpdateRequest request) {
        User updated = userService.updateProfile(user.getId(), request);
        return ApiResponse.success("Profile updated", updated);
    }

    @PostMapping("/apply-contributor")
    public ApiResponse<ContributorApplication> applyForContributor(@AuthenticationPrincipal User user,
                                                                    @Valid @RequestBody ContributorApplyRequest request) {
        ContributorApplication app = userService.applyForContributor(user.getId(), request.getReason());
        return ApiResponse.success("Application submitted", app);
    }
}
