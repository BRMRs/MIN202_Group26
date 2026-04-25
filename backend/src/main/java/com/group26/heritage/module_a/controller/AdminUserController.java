package com.group26.heritage.module_a.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_a.dto.ContributorApplicationListResponse;
import com.group26.heritage.module_a.dto.ContributorApplicationDetailResponse;
import com.group26.heritage.module_a.dto.ContributorRejectRequest;
import com.group26.heritage.module_a.service.UserService;
import jakarta.validation.Valid;
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
    public ApiResponse<List<ContributorApplicationListResponse>> getApplications() {
        List<ContributorApplicationListResponse> apps = userService.getApplicationsList();
        return ApiResponse.success(apps);
    }

    @GetMapping("/applications/{id}")
    public ApiResponse<ContributorApplicationDetailResponse> getApplication(@PathVariable Long id) {
        return ApiResponse.success(userService.getApplicationDetail(id));
    }

    @PutMapping("/applications/{id}/approve")
    public ApiResponse<Void> approveApplication(@PathVariable Long id,
                                                @AuthenticationPrincipal User admin) {
        userService.approveApplication(id, admin.getId());
        return ApiResponse.success("Application approved", null);
    }

    @PutMapping("/applications/{id}/reject")
    public ApiResponse<Void> rejectApplication(@PathVariable Long id,
                                               @AuthenticationPrincipal User admin,
                                               @Valid @RequestBody ContributorRejectRequest request) {
        userService.rejectApplication(id, admin.getId(), request.getReason());
        return ApiResponse.success("Application rejected", null);
    }
}
