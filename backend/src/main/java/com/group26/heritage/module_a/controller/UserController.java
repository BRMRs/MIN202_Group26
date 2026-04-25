package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_a.dto.ProfileUpdateRequest;
import com.group26.heritage.module_a.dto.UserProfileResponse;
import com.group26.heritage.module_a.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        UserProfileResponse profile = userService.getProfileWithStatus(user.getId());
        return ApiResponse.success(profile);
    }

    @PutMapping("/profile")
    public ApiResponse<User> updateProfile(@AuthenticationPrincipal User user,
                                           @RequestBody ProfileUpdateRequest request) {
        User updated = userService.updateProfile(user.getId(), request);
        return ApiResponse.success("Profile updated", updated);
    }

    @PostMapping(value = "/apply-contributor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ContributorApplication> applyForContributor(@AuthenticationPrincipal User user,
                                                                     @RequestParam("reason") String reason,
                                                                     @RequestParam(value = "files", required = false) List<MultipartFile> files) throws IOException {
        ContributorApplication app = userService.applyForContributor(user.getId(), reason, files);
        return ApiResponse.success("Application submitted", app);
    }
}
