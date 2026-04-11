package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.module_e.dto.CategoryDeactivationCheckResponse;
import com.group26.heritage.module_e.dto.CategoryMigrationRequest;
import com.group26.heritage.module_e.dto.CategoryRequest;
import com.group26.heritage.module_e.dto.CategoryResponse;
import com.group26.heritage.module_e.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Category controller for Module E.
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/admin/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @GetMapping
    public Result<List<CategoryResponse>> getAllCategories() {
        return Result.success(categoryService.getAllCategories());
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @PostMapping
    public Result<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return Result.success("Category created successfully", categoryService.createCategory(request));
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @PutMapping("/{id}")
    public Result<CategoryResponse> updateCategory(@PathVariable Long id,
                                                   @Valid @RequestBody CategoryRequest request) {
        return Result.success("Category updated successfully", categoryService.updateCategory(id, request));
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @PatchMapping("/{id}/status")
    public Result<CategoryResponse> updateStatus(@PathVariable Long id, @RequestBody String status) {
        String cleanStatus = status == null ? null : status.replace("\"", "").trim();
        return Result.success("Status updated successfully", categoryService.updateStatus(id, cleanStatus));
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @DeleteMapping("/{id}")
    public Result<CategoryResponse> deleteCategory(@PathVariable Long id) {
        return Result.success("Category marked as inactive successfully",
            categoryService.updateStatus(id, "INACTIVE"));
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @GetMapping("/{id}/deactivation-check")
    public Result<CategoryDeactivationCheckResponse> checkDeactivation(@PathVariable Long id) {
        return Result.success(categoryService.checkDeactivation(id));
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @PostMapping("/{id}/migrate-and-deactivate")
    public Result<CategoryResponse> migrateResourcesAndDeactivate(@PathVariable Long id,
                                                                  @Valid @RequestBody CategoryMigrationRequest request) {
        return Result.success("Resources migrated and category deactivated successfully",
            categoryService.migrateResourcesAndDeactivate(id, request));
    }
}
