package com.group26.heritage.module_e.service;

import com.group26.heritage.common.exception.BusinessException;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.AdminResourceResponse;
import com.group26.heritage.module_e.dto.AdminResourceRow;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class ResourceAdminService {
    private final ResourceRepository resourceRepository;
    private final CategoryRepository categoryRepository;

    public ResourceAdminService(ResourceRepository resourceRepository, CategoryRepository categoryRepository) {
        this.resourceRepository = resourceRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminResourceResponse> listResources() {
        return resourceRepository.findAdminResourceRows()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public AdminResourceResponse unpublish(Long resourceId) {
        Resource resource = findResourceOrThrow(resourceId);
        if (resource.getStatus() != ResourceStatus.APPROVED) {
            throw new BusinessException("Only APPROVED resources can be unpublished");
        }
        resource.setStatus(ResourceStatus.UNPUBLISHED);
        resource.setUpdatedAt(LocalDateTime.now());
        resourceRepository.save(resource);
        return getResource(resourceId);
    }

    @Transactional
    public AdminResourceResponse archive(Long resourceId) {
        Resource resource = findResourceOrThrow(resourceId);
        if (resource.getStatus() != ResourceStatus.APPROVED && resource.getStatus() != ResourceStatus.UNPUBLISHED) {
            throw new BusinessException("Only APPROVED or UNPUBLISHED resources can be archived");
        }
        resource.setStatus(ResourceStatus.ARCHIVED);
        resource.setUpdatedAt(LocalDateTime.now());
        resourceRepository.save(resource);
        return getResource(resourceId);
    }

    @Transactional
    public AdminResourceResponse republish(Long resourceId, Long categoryId) {
        Resource resource = findResourceOrThrow(resourceId);
        if (resource.getStatus() != ResourceStatus.UNPUBLISHED) {
            throw new BusinessException("Only UNPUBLISHED resources can be republished");
        }

        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new BusinessException("Republish requires an ACTIVE category");
        }

        resource.setCategoryId(categoryId);
        resource.setStatus(ResourceStatus.APPROVED);
        resource.setUpdatedAt(LocalDateTime.now());
        resourceRepository.save(resource);
        return getResource(resourceId);
    }

    private AdminResourceResponse getResource(Long resourceId) {
        return resourceRepository.findAdminResourceRows()
            .stream()
            .filter(item -> resourceId.equals(item.getId()))
            .findFirst()
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
    }

    private Resource findResourceOrThrow(Long resourceId) {
        return resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
    }

    private AdminResourceResponse toResponse(AdminResourceRow row) {
        return new AdminResourceResponse(
            row.getId(),
            row.getTitle(),
            row.getContributorName(),
            row.getCategoryId(),
            row.getCategoryName(),
            row.getCategoryStatus(),
            ResourceStatus.valueOf(row.getStatus()),
            row.getUpdatedAt(),
            parseTags(row.getTags())
        );
    }

    private List<String> parseTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .toList();
    }
}
