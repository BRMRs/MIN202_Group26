package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.module_e.dto.TagCreateResponse;
import com.group26.heritage.module_e.dto.TagRequest;
import com.group26.heritage.module_e.dto.TagResponse;
import com.group26.heritage.module_e.service.TagService;
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
class TagControllerTest {

    @Mock
    private TagService tagService;

    @InjectMocks
    private TagController tagController;

    @Test
    void getAllTagsPassesSearchParameterToService() {
        TagResponse tag = tagResponse(1L, "Festival", false);
        when(tagService.getAllTags("fest")).thenReturn(List.of(tag));

        Result<List<TagResponse>> result = tagController.getAllTags("fest");

        assertThat(result.success()).isTrue();
        assertThat(result.data()).containsExactly(tag);
        verify(tagService).getAllTags("fest");
    }

    @Test
    void createTagCallsServiceAndReturnsCreatePayload() {
        TagRequest request = new TagRequest("Craft");
        TagResponse tag = tagResponse(2L, "Craft", false);
        TagCreateResponse serviceResponse = new TagCreateResponse("CREATED", 2L, tag);
        when(tagService.createTag(request)).thenReturn(serviceResponse);

        Result<TagCreateResponse> result = tagController.createTag(request);

        assertThat(result.message()).isEqualTo("Tag created successfully");
        assertThat(result.data()).isEqualTo(serviceResponse);
        verify(tagService).createTag(request);
    }

    @Test
    void updateTagCallsServiceAndReturnsUpdatedTag() {
        TagRequest request = new TagRequest("Updated");
        TagResponse tag = tagResponse(3L, "Updated", false);
        when(tagService.updateTag(3L, request)).thenReturn(tag);

        Result<TagResponse> result = tagController.updateTag(3L, request);

        assertThat(result.message()).isEqualTo("Tag updated successfully");
        assertThat(result.data()).isEqualTo(tag);
        verify(tagService).updateTag(3L, request);
    }

    @Test
    void deleteTagCallsSoftDeleteService() {
        TagResponse tag = tagResponse(4L, "Removed", true);
        when(tagService.deleteTag(4L)).thenReturn(tag);

        Result<TagResponse> result = tagController.deleteTag(4L);

        assertThat(result.message()).isEqualTo("Tag deleted successfully");
        assertThat(result.data()).isEqualTo(tag);
        verify(tagService).deleteTag(4L);
    }

    @Test
    void restoreTagCallsRestoreService() {
        TagResponse tag = tagResponse(5L, "Restored", false);
        when(tagService.restoreTag(5L)).thenReturn(tag);

        Result<TagResponse> result = tagController.restoreTag(5L);

        assertThat(result.message()).isEqualTo("Tag restored successfully");
        assertThat(result.data()).isEqualTo(tag);
        verify(tagService).restoreTag(5L);
    }

    private static TagResponse tagResponse(Long id, String name, Boolean deleted) {
        return new TagResponse(id, name, deleted, LocalDateTime.now(), 0L);
    }
}
