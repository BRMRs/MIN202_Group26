package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_a.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/applications")
    public ApiResponse<List<ContributorApplication>> getPendingApplications() {
        List<ContributorApplication> apps = userService.getPendingApplications();
        return ApiResponse.success(apps);
    }

    @PutMapping("/applications/{id}/approve")
    public ApiResponse<Void> approveApplication(@PathVariable Long id,
                                                @AuthenticationPrincipal User admin) {
        userService.approveApplication(id, admin.getId());
        return ApiResponse.success("Application approved", null);
    }

    @PutMapping("/applications/{id}/reject")
    public ApiResponse<Void> rejectApplication(@PathVariable Long id,
                                               @AuthenticationPrincipal User admin) {
        userService.rejectApplication(id, admin.getId());
        return ApiResponse.success("Application rejected", null);
    }
}
