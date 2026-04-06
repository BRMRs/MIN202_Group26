package com.group26.heritage.module_e.service;

import com.group26.heritage.common.exception.BusinessException;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.CategoryRequest;
import com.group26.heritage.module_e.dto.CategoryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Category service for Module E.
 */
@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ResourceRepository resourceRepository;

    public CategoryService(CategoryRepository categoryRepository, ResourceRepository resourceRepository) {
        this.categoryRepository = categoryRepository;
        this.resourceRepository = resourceRepository;
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String normalizedName = normalizeName(request.name());
        validateUniqueName(normalizedName, null);

        Category category = new Category();
        category.setName(normalizedName);
        category.setDescription(normalizeDescription(request.description()));
        category.setStatus(request.status());

        Category savedCategory = categoryRepository.save(category);
        cascadeResourcesIfCategoryBecomesInactive(savedCategory.getId(), null, savedCategory.getStatus());
        return toResponse(savedCategory);
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategoryOrThrow(id);
        String normalizedName = normalizeName(request.name());
        validateUniqueName(normalizedName, id);

        CategoryStatus previousStatus = category.getStatus();
        category.setName(normalizedName);
        category.setDescription(normalizeDescription(request.description()));
        category.setStatus(request.status());

        Category updatedCategory = categoryRepository.save(category);
        cascadeResourcesIfCategoryBecomesInactive(updatedCategory.getId(), previousStatus, updatedCategory.getStatus());
        return toResponse(updatedCategory);
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public CategoryResponse updateStatus(Long id, String status) {
        Category category = findCategoryOrThrow(id);
        CategoryStatus targetStatus = parseStatus(status);
        CategoryStatus previousStatus = category.getStatus();

        category.setStatus(targetStatus);
        Category updatedCategory = categoryRepository.save(category);
        cascadeResourcesIfCategoryBecomesInactive(updatedCategory.getId(), previousStatus, updatedCategory.getStatus());
        return toResponse(updatedCategory);
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public void deleteCategory(Long id) {
        updateStatus(id, CategoryStatus.INACTIVE.name());
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }

    private void validateUniqueName(String normalizedName, Long categoryId) {
        boolean exists = categoryId == null
            ? categoryRepository.existsByNameIgnoreCase(normalizedName)
            : categoryRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, categoryId);
        if (exists) {
            throw new BusinessException("Category name already exists");
        }
    }

    private CategoryStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new BusinessException("Status must not be empty");
        }

        try {
            return CategoryStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BusinessException("Unsupported category status: " + status);
        }
    }

    private void cascadeResourcesIfCategoryBecomesInactive(Long categoryId,
                                                           CategoryStatus previousStatus,
                                                           CategoryStatus currentStatus) {
        if (currentStatus != CategoryStatus.INACTIVE) {
            return;
        }
        if (previousStatus == CategoryStatus.INACTIVE) {
            return;
        }

        resourceRepository.updateStatusByCategoryIdAndStatus(
            categoryId,
            ResourceStatus.APPROVED,
            ResourceStatus.UNPUBLISHED
        );
    }

    private String normalizeName(String rawName) {
        String normalizedName = rawName == null ? null : rawName.trim();
        if (normalizedName == null || normalizedName.isEmpty()) {
            throw new BusinessException("Category name must not be empty");
        }
        return normalizedName;
    }

    private String normalizeDescription(String rawDescription) {
        if (rawDescription == null) {
            return null;
        }
        String normalizedDescription = rawDescription.trim();
        return normalizedDescription.isEmpty() ? null : normalizedDescription;
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.getStatus(),
            category.getCreatedAt()
        );
    }
}
