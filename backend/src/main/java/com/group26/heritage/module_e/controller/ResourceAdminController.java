package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.module_e.dto.AdminResourceResponse;
import com.group26.heritage.module_e.dto.ResourceRepublishRequest;
import com.group26.heritage.module_e.service.ResourceAdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/admin/resources")
public class ResourceAdminController {
    private final ResourceAdminService resourceAdminService;

    public ResourceAdminController(ResourceAdminService resourceAdminService) {
        this.resourceAdminService = resourceAdminService;
    }

    @GetMapping
    public Result<List<AdminResourceResponse>> listResources() {
        return Result.success(resourceAdminService.listResources());
    }

    @PatchMapping("/{id}/unpublish")
    public Result<AdminResourceResponse> unpublish(@PathVariable Long id) {
        return Result.success("Resource unpublished", resourceAdminService.unpublish(id));
    }

    @PatchMapping("/{id}/archive")
    public Result<AdminResourceResponse> archive(@PathVariable Long id) {
        return Result.success("Resource archived", resourceAdminService.archive(id));
    }

    @PatchMapping("/{id}/republish")
    public Result<AdminResourceResponse> republish(@PathVariable Long id,
                                                   @Valid @RequestBody ResourceRepublishRequest request) {
        return Result.success("Resource republished", resourceAdminService.republish(id, request.categoryId()));
    }
}
