package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.module_e.dto.CategoryDeactivationCheckResponse;
import com.group26.heritage.module_e.dto.CategoryMigrationGroup;
import com.group26.heritage.module_e.dto.CategoryMigrationRequest;
import com.group26.heritage.module_e.dto.CategoryMigrationTarget;
import com.group26.heritage.module_e.dto.CategoryRequest;
import com.group26.heritage.module_e.dto.CategoryResponse;
import com.group26.heritage.module_e.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    @Test
    void getAllCategoriesWrapsServiceDataInSuccessResult() {
        CategoryResponse category = categoryResponse(1L, "Music", CategoryStatus.ACTIVE);
        when(categoryService.getAllCategories()).thenReturn(List.of(category));

        Result<List<CategoryResponse>> result = categoryController.getAllCategories();

        assertThat(result.success()).isTrue();
        assertThat(result.data()).containsExactly(category);
    }

    @Test
    void createCategoryCallsServiceAndReturnsSuccessMessage() {
        CategoryRequest request = new CategoryRequest("Music", "Traditional music", CategoryStatus.ACTIVE);
        CategoryResponse response = categoryResponse(1L, "Music", CategoryStatus.ACTIVE);
        when(categoryService.createCategory(request)).thenReturn(response);

        Result<CategoryResponse> result = categoryController.createCategory(request);

        assertThat(result.success()).isTrue();
        assertThat(result.message()).isEqualTo("Category created successfully");
        assertThat(result.data()).isEqualTo(response);
        verify(categoryService).createCategory(request);
    }

    @Test
    void updateCategoryCallsServiceAndReturnsSuccessMessage() {
        CategoryRequest request = new CategoryRequest("Craft", "Handmade craft", CategoryStatus.ACTIVE);
        CategoryResponse response = categoryResponse(2L, "Craft", CategoryStatus.ACTIVE);
        when(categoryService.updateCategory(2L, request)).thenReturn(response);

        Result<CategoryResponse> result = categoryController.updateCategory(2L, request);

        assertThat(result.message()).isEqualTo("Category updated successfully");
        assertThat(result.data()).isEqualTo(response);
        verify(categoryService).updateCategory(2L, request);
    }

    @Test
    void updateStatusStripsJsonQuotesBeforeCallingService() {
        CategoryResponse response = categoryResponse(3L, "Dance", CategoryStatus.INACTIVE);
        when(categoryService.updateStatus(3L, "INACTIVE")).thenReturn(response);

        Result<CategoryResponse> result = categoryController.updateStatus(3L, "\"INACTIVE\"");

        assertThat(result.message()).isEqualTo("Status updated successfully");
        assertThat(result.data()).isEqualTo(response);
        verify(categoryService).updateStatus(3L, "INACTIVE");
    }

    @Test
    void deleteCategoryMarksCategoryInactiveThroughService() {
        CategoryResponse response = categoryResponse(4L, "Old Category", CategoryStatus.INACTIVE);
        when(categoryService.updateStatus(4L, "INACTIVE")).thenReturn(response);

        Result<CategoryResponse> result = categoryController.deleteCategory(4L);

        assertThat(result.message()).isEqualTo("Category marked as inactive successfully");
        assertThat(result.data()).isEqualTo(response);
        verify(categoryService).updateStatus(4L, "INACTIVE");
    }

    @Test
    void checkDeactivationReturnsServiceData() {
        CategoryDeactivationCheckResponse response = new CategoryDeactivationCheckResponse(
            5L,
            "Archive",
            0L,
            true,
            List.of(),
            List.of(new CategoryMigrationTarget(6L, "Target"))
        );
        when(categoryService.checkDeactivation(5L)).thenReturn(response);

        Result<CategoryDeactivationCheckResponse> result = categoryController.checkDeactivation(5L);

        assertThat(result.success()).isTrue();
        assertThat(result.data()).isEqualTo(response);
        verify(categoryService).checkDeactivation(5L);
    }

    @Test
    void migrateResourcesAndDeactivateCallsServiceAndReturnsSuccessMessage() {
        CategoryMigrationRequest request = new CategoryMigrationRequest(
            List.of(new CategoryMigrationGroup(List.of(10L, 11L), 2L))
        );
        CategoryResponse response = categoryResponse(1L, "Old Category", CategoryStatus.INACTIVE);
        when(categoryService.migrateResourcesAndDeactivate(1L, request)).thenReturn(response);

        Result<CategoryResponse> result = categoryController.migrateResourcesAndDeactivate(1L, request);

        assertThat(result.message()).isEqualTo("Resources migrated and category deactivated successfully");
        assertThat(result.data()).isEqualTo(response);
        verify(categoryService).migrateResourcesAndDeactivate(1L, request);
    }

    private static CategoryResponse categoryResponse(Long id, String name, CategoryStatus status) {
        return new CategoryResponse(id, name, "Description", status, LocalDateTime.now(), false);
    }
}
