package com.group26.heritage.module_e.service;

import com.group26.heritage.common.exception.BusinessException;
import com.group26.heritage.common.exception.ConflictException;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.Tag;
import com.group26.heritage.module_e.dto.TagCreateResponse;
import com.group26.heritage.module_e.dto.TagRequest;
import com.group26.heritage.module_e.dto.TagResponse;
import com.group26.heritage.module_e.dto.TagUsageRow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    @Test
    void getAllTagsWithoutSearchUsesActiveTagSummaryQuery() {
        when(tagRepository.findActiveTagsWithApprovedResourceCount())
            .thenReturn(List.of(tagUsageRow(1L, "Dance", false, 3L)));

        List<TagResponse> response = tagService.getAllTags("   ");

        assertThat(response).hasSize(1);
        assertThat(response.get(0).name()).isEqualTo("Dance");
        assertThat(response.get(0).approvedResourceCount()).isEqualTo(3L);
        verify(tagRepository).findActiveTagsWithApprovedResourceCount();
    }

    @Test
    void getAllTagsWithSearchTrimsKeywordAndUsesSearchQuery() {
        when(tagRepository.searchActiveTagsWithApprovedResourceCount("silk"))
            .thenReturn(List.of(tagUsageRow(2L, "Silk Road", false, 5L)));

        List<TagResponse> response = tagService.getAllTags("  silk  ");

        assertThat(response).extracting(TagResponse::name).containsExactly("Silk Road");
        verify(tagRepository).searchActiveTagsWithApprovedResourceCount("silk");
    }

    @Test
    void createTagSavesNewTagWhenNameIsUnique() {
        when(tagRepository.findByNameIgnoreCase("Embroidery")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(invocation -> {
            Tag saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });
        when(tagRepository.countApprovedResourcesByTagId(10L)).thenReturn(0L);

        TagCreateResponse response = tagService.createTag(new TagRequest("  Embroidery  "));

        assertThat(response.status()).isEqualTo("CREATED");
        assertThat(response.tagId()).isEqualTo(10L);
        assertThat(response.tag().name()).isEqualTo("Embroidery");
        assertThat(response.tag().isDeleted()).isFalse();
    }

    @Test
    void createTagRejectsExistingActiveTag() {
        when(tagRepository.findByNameIgnoreCase("Dance")).thenReturn(Optional.of(tag(1L, "Dance", false)));

        assertThatThrownBy(() -> tagService.createTag(new TagRequest("Dance")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("Tag name already exists");

        verify(tagRepository, never()).save(any(Tag.class));
    }

    @Test
    void createTagReturnsDeletedExistsWhenDeletedTagHasSameName() {
        when(tagRepository.findByNameIgnoreCase("Dance")).thenReturn(Optional.of(tag(1L, "Dance", true)));

        TagCreateResponse response = tagService.createTag(new TagRequest("Dance"));

        assertThat(response.status()).isEqualTo("DELETED_EXISTS");
        assertThat(response.tagId()).isEqualTo(1L);
        assertThat(response.tag()).isNull();
    }

    @Test
    void updateTagRenamesActiveTagWhenNameIsUnique() {
        Tag tag = tag(1L, "Old Name", false);
        when(tagRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse("New Name", 1L)).thenReturn(false);
        when(tagRepository.save(tag)).thenReturn(tag);
        when(tagRepository.countApprovedResourcesByTagId(1L)).thenReturn(4L);

        TagResponse response = tagService.updateTag(1L, new TagRequest("  New Name  "));

        assertThat(response.name()).isEqualTo("New Name");
        assertThat(response.approvedResourceCount()).isEqualTo(4L);
    }

    @Test
    void updateTagRejectsBlankName() {
        when(tagRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(tag(1L, "Dance", false)));

        assertThatThrownBy(() -> tagService.updateTag(1L, new TagRequest("  ")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Tag name must not be empty");
    }

    @Test
    void deleteTagSoftDeletesActiveTag() {
        Tag tag = tag(1L, "Dance", false);
        when(tagRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(tag)).thenReturn(tag);
        when(tagRepository.countApprovedResourcesByTagId(1L)).thenReturn(2L);

        TagResponse response = tagService.deleteTag(1L);

        assertThat(response.isDeleted()).isTrue();
        verify(tagRepository).save(tag);
    }

    @Test
    void restoreTagRestoresDeletedTagWhenNoActiveDuplicateExists() {
        Tag deletedTag = tag(1L, "Dance", true);
        when(tagRepository.findById(1L)).thenReturn(Optional.of(deletedTag));
        when(tagRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse("Dance", 1L)).thenReturn(false);
        when(tagRepository.save(deletedTag)).thenReturn(deletedTag);
        when(tagRepository.countApprovedResourcesByTagId(1L)).thenReturn(2L);

        TagResponse response = tagService.restoreTag(1L);

        assertThat(response.isDeleted()).isFalse();
    }

    @Test
    void restoreTagRejectsMissingTag() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.restoreTag(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Tag not found: 99");
    }

    @Test
    void restoreTagRejectsActiveDuplicateName() {
        Tag deletedTag = tag(1L, "Dance", true);
        when(tagRepository.findById(1L)).thenReturn(Optional.of(deletedTag));
        when(tagRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse("Dance", 1L)).thenReturn(true);

        assertThatThrownBy(() -> tagService.restoreTag(1L))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("active tag with the same name");
    }

    private static Tag tag(Long id, String name, boolean deleted) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(name);
        tag.setIsDeleted(deleted);
        tag.setCreatedAt(LocalDateTime.now());
        return tag;
    }

    private static TagUsageRow tagUsageRow(Long id, String name, Boolean deleted, Long approvedResourceCount) {
        return new TagUsageRow() {
            @Override
            public Long getId() {
                return id;
            }

            @Override
            public String getName() {
                return name;
            }

            @Override
            public Boolean getIsDeleted() {
                return deleted;
            }

            @Override
            public LocalDateTime getCreatedAt() {
                return LocalDateTime.now();
            }

            @Override
            public Long getApprovedResourceCount() {
                return approvedResourceCount;
            }
        };
    }
}
