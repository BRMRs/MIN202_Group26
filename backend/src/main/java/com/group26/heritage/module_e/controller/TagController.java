package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.module_e.dto.TagCreateResponse;
import com.group26.heritage.module_e.dto.TagRequest;
import com.group26.heritage.module_e.dto.TagResponse;
import com.group26.heritage.module_e.service.TagService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Tag controller for Module E.
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/admin/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @GetMapping
    public Result<List<TagResponse>> getAllTags(@RequestParam(required = false) String search) {
        return Result.success(tagService.getAllTags(search));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @PostMapping
    public Result<TagCreateResponse> createTag(@Valid @RequestBody TagRequest request) {
        return Result.success("Tag created successfully", tagService.createTag(request));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @PutMapping("/{id}")
    public Result<TagResponse> updateTag(@PathVariable Long id, @Valid @RequestBody TagRequest request) {
        return Result.success("Tag updated successfully", tagService.updateTag(id, request));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @DeleteMapping("/{id}")
    public Result<TagResponse> deleteTag(@PathVariable Long id) {
        return Result.success("Tag deleted successfully", tagService.deleteTag(id));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @PatchMapping("/{id}/restore")
    public Result<TagResponse> restoreTag(@PathVariable Long id) {
        return Result.success("Tag restored successfully", tagService.restoreTag(id));
    }
}
