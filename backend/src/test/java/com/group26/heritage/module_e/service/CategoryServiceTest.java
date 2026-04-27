package com.group26.heritage.module_e.service;

import com.group26.heritage.common.exception.BusinessException;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.CategoryDeactivationCheckResponse;
import com.group26.heritage.module_e.dto.CategoryMigrationGroup;
import com.group26.heritage.module_e.dto.CategoryMigrationRequest;
import com.group26.heritage.module_e.dto.CategoryRequest;
import com.group26.heritage.module_e.dto.CategoryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void createCategoryNormalizesInputAndSavesNonDefaultCategory() {
        when(categoryRepository.existsByNameIgnoreCase("Calligraphy")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        CategoryResponse response = categoryService.createCategory(
            new CategoryRequest("  Calligraphy  ", "  Ink art  ", CategoryStatus.ACTIVE)
        );

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Calligraphy");
        assertThat(response.description()).isEqualTo("Ink art");
        assertThat(response.status()).isEqualTo(CategoryStatus.ACTIVE);
        assertThat(response.defaultFlag()).isFalse();
    }

    @Test
    void createCategoryRejectsBlankName() {
        assertThatThrownBy(() -> categoryService.createCategory(
            new CategoryRequest("   ", "Description", CategoryStatus.ACTIVE)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Category name must not be empty");

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void createCategoryRejectsDuplicateName() {
        when(categoryRepository.existsByNameIgnoreCase("Music")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(
            new CategoryRequest("Music", null, CategoryStatus.ACTIVE)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Category name already exists");
    }

    @Test
    void createCategoryRejectsNullStatus() {
        when(categoryRepository.existsByNameIgnoreCase("Music")).thenReturn(false);

        assertThatThrownBy(() -> categoryService.createCategory(
            new CategoryRequest("Music", null, null)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Category status must not be null");

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void updateCategoryRejectsMissingCategory() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(
            99L,
            new CategoryRequest("Dance", null, CategoryStatus.ACTIVE)
        ))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Category not found: 99");
    }

    @Test
    void updateCategoryRejectsNullStatus() {
        Category category = category(1L, "Music", CategoryStatus.ACTIVE);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByNameIgnoreCaseAndIdNot("Music", 1L)).thenReturn(false);

        assertThatThrownBy(() -> categoryService.updateCategory(
            1L,
            new CategoryRequest("Music", null, null)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Category status must not be null");

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void updateStatusRejectsInvalidStatus() {
        Category category = category(1L, "Craft", CategoryStatus.ACTIVE);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> categoryService.updateStatus(1L, "paused"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Unsupported category status");
    }

    @Test
    void updateStatusRejectsDeactivationWhenCategoryStillContainsResources() {
        Category category = category(1L, "Craft", CategoryStatus.ACTIVE);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(resourceRepository.countByCategoryId(1L)).thenReturn(2L);

        assertThatThrownBy(() -> categoryService.updateStatus(1L, "INACTIVE"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("still contains resources");

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void checkDeactivationReturnsResourcesAndActiveMigrationTargets() {
        Category source = category(1L, "Old Category", CategoryStatus.ACTIVE);
        Resource resource = resource(10L, "Bronze Bell", 1L, "Old Category");
        Category target = category(2L, "New Category", CategoryStatus.ACTIVE);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(source));
        when(resourceRepository.findByCategoryIdOrderByIdAsc(1L)).thenReturn(List.of(resource));
        when(categoryRepository.findAllByStatusOrderByNameAsc(CategoryStatus.ACTIVE)).thenReturn(List.of(source, target));

        CategoryDeactivationCheckResponse response = categoryService.checkDeactivation(1L);

        assertThat(response.categoryId()).isEqualTo(1L);
        assertThat(response.resourceCount()).isEqualTo(1);
        assertThat(response.canDeactivateDirectly()).isFalse();
        assertThat(response.resources()).extracting("id").containsExactly(10L);
        assertThat(response.targetCategories()).extracting("id").containsExactly(2L);
    }

    @Test
    void migrateResourcesAndDeactivateMigratesEveryResourceThenMarksCategoryInactive() {
        Category source = category(1L, "Old Category", CategoryStatus.ACTIVE);
        Category target = category(2L, "New Category", CategoryStatus.ACTIVE);
        Resource first = resource(10L, "Bronze Bell", 1L, "Old Category");
        Resource second = resource(11L, "Folk Song", 1L, "Old Category");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(source));
        when(resourceRepository.findByCategoryIdOrderByIdAsc(1L)).thenReturn(List.of(first, second));
        when(categoryRepository.findAllById(any())).thenReturn(List.of(target));
        when(resourceRepository.migrateCategoryByIds(1L, 2L, "New Category", List.of(10L, 11L))).thenReturn(2);
        when(resourceRepository.countByCategoryId(1L)).thenReturn(0L);
        when(categoryRepository.save(source)).thenReturn(source);

        CategoryResponse response = categoryService.migrateResourcesAndDeactivate(
            1L,
            new CategoryMigrationRequest(List.of(new CategoryMigrationGroup(List.of(10L, 11L), 2L)))
        );

        assertThat(response.status()).isEqualTo(CategoryStatus.INACTIVE);
        verify(resourceRepository).migrateCategoryByIds(1L, 2L, "New Category", List.of(10L, 11L));
    }

    @Test
    void migrateResourcesAndDeactivateRejectsMigrationThatDoesNotCoverEveryResource() {
        Category source = category(1L, "Old Category", CategoryStatus.ACTIVE);
        Resource first = resource(10L, "Bronze Bell", 1L, "Old Category");
        Resource second = resource(11L, "Folk Song", 1L, "Old Category");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(source));
        when(resourceRepository.findByCategoryIdOrderByIdAsc(1L)).thenReturn(List.of(first, second));

        assertThatThrownBy(() -> categoryService.migrateResourcesAndDeactivate(
            1L,
            new CategoryMigrationRequest(List.of(new CategoryMigrationGroup(List.of(10L), 2L)))
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("cover every resource");
    }

    @Test
    void migrateResourcesAndDeactivateRejectsDuplicateResourceIds() {
        Category source = category(1L, "Old Category", CategoryStatus.ACTIVE);
        Resource first = resource(10L, "Bronze Bell", 1L, "Old Category");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(source));
        when(resourceRepository.findByCategoryIdOrderByIdAsc(1L)).thenReturn(List.of(first));

        assertThatThrownBy(() -> categoryService.migrateResourcesAndDeactivate(
            1L,
            new CategoryMigrationRequest(List.of(
                new CategoryMigrationGroup(List.of(10L), 2L),
                new CategoryMigrationGroup(List.of(10L), 3L)
            ))
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("multiple migration groups");
    }

    @Test
    void migrateResourcesAndDeactivateRejectsInactiveTargetCategory() {
        Category source = category(1L, "Old Category", CategoryStatus.ACTIVE);
        Category inactiveTarget = category(2L, "Inactive Target", CategoryStatus.INACTIVE);
        Resource first = resource(10L, "Bronze Bell", 1L, "Old Category");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(source));
        when(resourceRepository.findByCategoryIdOrderByIdAsc(1L)).thenReturn(List.of(first));
        when(categoryRepository.findAllById(any())).thenReturn(List.of(inactiveTarget));

        assertThatThrownBy(() -> categoryService.migrateResourcesAndDeactivate(
            1L,
            new CategoryMigrationRequest(List.of(new CategoryMigrationGroup(List.of(10L), 2L)))
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Target categories must be ACTIVE");
    }

    private static Category category(Long id, String name, CategoryStatus status) {
        Category category = new Category();
        category.setId(id);
        category.setName(name);
        category.setStatus(status);
        return category;
    }

    private static Resource resource(Long id, String title, Long categoryId, String categoryName) {
        Resource resource = new Resource();
        resource.setId(id);
        resource.setTitle(title);
        resource.setCategoryId(categoryId);
        resource.setCategory(categoryName);
        resource.setContributorId(100L);
        resource.setStatus(ResourceStatus.APPROVED);
        return resource;
    }
}
