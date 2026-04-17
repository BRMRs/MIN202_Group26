package com.group26.heritage.module_e.service;

import com.group26.heritage.common.exception.BusinessException;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.module_e.dto.CategoryDeactivationCheckResponse;
import com.group26.heritage.module_e.dto.CategoryMigrationGroup;
import com.group26.heritage.module_e.dto.CategoryMigrationRequest;
import com.group26.heritage.module_e.dto.CategoryMigrationTarget;
import com.group26.heritage.module_e.dto.CategoryRequest;
import com.group26.heritage.module_e.dto.CategoryResponse;
import com.group26.heritage.module_e.dto.CategoryResourceMigrationItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

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
        category.setDefaultFlag(false);

        Category savedCategory = categoryRepository.save(category);
        return toResponse(savedCategory);
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategoryOrThrow(id);
        String normalizedName = normalizeName(request.name());
        validateUniqueName(normalizedName, id);

        CategoryStatus previousStatus = category.getStatus();
        validateCanDeactivate(category.getId(), previousStatus, request.status());
        category.setName(normalizedName);
        category.setDescription(normalizeDescription(request.description()));
        category.setStatus(request.status());

        Category updatedCategory = categoryRepository.save(category);
        return toResponse(updatedCategory);
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public CategoryResponse updateStatus(Long id, String status) {
        Category category = findCategoryOrThrow(id);
        CategoryStatus targetStatus = parseStatus(status);
        CategoryStatus previousStatus = category.getStatus();

        validateCanDeactivate(category.getId(), previousStatus, targetStatus);
        category.setStatus(targetStatus);
        Category updatedCategory = categoryRepository.save(category);
        return toResponse(updatedCategory);
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public void deleteCategory(Long id) {
        updateStatus(id, CategoryStatus.INACTIVE.name());
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional(readOnly = true)
    public CategoryDeactivationCheckResponse checkDeactivation(Long id) {
        Category category = findCategoryOrThrow(id);
        List<Resource> resources = resourceRepository.findByCategoryIdOrderByIdAsc(id);
        List<CategoryMigrationTarget> targetCategories = categoryRepository.findAllByStatusOrderByNameAsc(CategoryStatus.ACTIVE)
            .stream()
            .filter(target -> !target.getId().equals(id))
            .map(target -> new CategoryMigrationTarget(target.getId(), target.getName()))
            .toList();

        return new CategoryDeactivationCheckResponse(
            category.getId(),
            category.getName(),
            resources.size(),
            resources.isEmpty(),
            resources.stream()
                .map(resource -> toMigrationItem(resource, category))
                .toList(),
            targetCategories
        );
    }

    // PBI 5.1 / Task 2: Create category list, create, edit, status switch, and delete APIs
    @Transactional
    public CategoryResponse migrateResourcesAndDeactivate(Long id, CategoryMigrationRequest request) {
        Category category = findCategoryOrThrow(id);
        if (category.getStatus() == CategoryStatus.INACTIVE) {
            throw new BusinessException("Category is already inactive");
        }

        List<Resource> sourceResources = resourceRepository.findByCategoryIdOrderByIdAsc(id);
        if (sourceResources.isEmpty()) {
            validateNoMigrationGroups(request);
        } else {
            migrateAllCategoryResources(category, sourceResources, request);
        }

        long remainingResources = resourceRepository.countByCategoryId(id);
        if (remainingResources > 0) {
            throw new BusinessException("All resources must be migrated before deactivating this category");
        }

        category.setStatus(CategoryStatus.INACTIVE);
        return toResponse(categoryRepository.save(category));
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

    private void validateCanDeactivate(Long categoryId,
                                       CategoryStatus previousStatus,
                                       CategoryStatus currentStatus) {
        if (currentStatus != CategoryStatus.INACTIVE || previousStatus == CategoryStatus.INACTIVE) {
            return;
        }

        long resourceCount = resourceRepository.countByCategoryId(categoryId);
        if (resourceCount > 0) {
            throw new BusinessException("This category still contains resources. Please migrate them before deactivation.");
        }
    }

    private void validateNoMigrationGroups(CategoryMigrationRequest request) {
        if (request != null && request.migrations() != null && !request.migrations().isEmpty()) {
            throw new BusinessException("This category has no resources to migrate");
        }
    }

    private void migrateAllCategoryResources(Category category,
                                             List<Resource> sourceResources,
                                             CategoryMigrationRequest request) {
        if (request == null || request.migrations() == null || request.migrations().isEmpty()) {
            throw new BusinessException("Migration groups are required before deactivating a category with resources");
        }

        Map<Long, Resource> sourceResourcesById = sourceResources.stream()
            .collect(Collectors.toMap(Resource::getId, Function.identity()));
        Set<Long> requestedResourceIds = collectRequestedResourceIds(request.migrations());

        if (!requestedResourceIds.equals(sourceResourcesById.keySet())) {
            throw new BusinessException("Migration groups must cover every resource in the category and no unrelated resources");
        }

        Map<Long, Category> targetsById = loadMigrationTargets(category.getId(), request.migrations());
        for (CategoryMigrationGroup group : request.migrations()) {
            Category targetCategory = targetsById.get(group.targetCategoryId());
            int updatedRows = resourceRepository.migrateCategoryByIds(
                category.getId(),
                targetCategory.getId(),
                targetCategory.getName(),
                group.resourceIds()
            );
            if (updatedRows != group.resourceIds().size()) {
                throw new BusinessException("Some resources could not be migrated. Please refresh and try again.");
            }
        }
    }

    private Set<Long> collectRequestedResourceIds(List<CategoryMigrationGroup> groups) {
        Set<Long> requestedResourceIds = new HashSet<>();
        for (CategoryMigrationGroup group : groups) {
            if (group == null || group.resourceIds() == null || group.resourceIds().isEmpty()) {
                throw new BusinessException("Each migration group must contain resource ids");
            }
            for (Long resourceId : group.resourceIds()) {
                if (resourceId == null) {
                    throw new BusinessException("Resource id must not be null");
                }
                if (!requestedResourceIds.add(resourceId)) {
                    throw new BusinessException("A resource cannot appear in multiple migration groups");
                }
            }
        }
        return requestedResourceIds;
    }

    private Map<Long, Category> loadMigrationTargets(Long sourceCategoryId, List<CategoryMigrationGroup> groups) {
        Set<Long> targetCategoryIds = groups.stream()
            .map(CategoryMigrationGroup::targetCategoryId)
            .collect(Collectors.toSet());
        if (targetCategoryIds.contains(null)) {
            throw new BusinessException("Target category id must not be null");
        }
        if (targetCategoryIds.contains(sourceCategoryId)) {
            throw new BusinessException("Target category must be different from the deactivated category");
        }

        Map<Long, Category> targetsById = new HashMap<>();
        for (Category targetCategory : categoryRepository.findAllById(targetCategoryIds)) {
            targetsById.put(targetCategory.getId(), targetCategory);
        }
        if (targetsById.size() != targetCategoryIds.size()) {
            throw new ResourceNotFoundException("One or more target categories were not found");
        }
        for (Category targetCategory : targetsById.values()) {
            if (targetCategory.getStatus() != CategoryStatus.ACTIVE) {
                throw new BusinessException("Target categories must be ACTIVE");
            }
        }
        return targetsById;
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
            category.getCreatedAt(),
            category.isDefaultFlag()
        );
    }

    private CategoryResourceMigrationItem toMigrationItem(Resource resource, Category category) {
        String categoryName = resource.getCategory();
        if (categoryName == null || categoryName.isBlank()) {
            categoryName = category.getName();
        }

        return new CategoryResourceMigrationItem(
            resource.getId(),
            resource.getTitle(),
            resource.getStatus(),
            resource.getCategoryId(),
            categoryName
        );
    }
}
