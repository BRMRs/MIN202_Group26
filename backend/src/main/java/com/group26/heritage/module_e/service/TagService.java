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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Tag service for Module E.
 */
@Service
public class TagService {
    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags(String search) {
        String normalizedSearch = search == null ? "" : search.trim();

        List<TagUsageRow> tags = normalizedSearch.isEmpty()
            ? tagRepository.findActiveTagsWithApprovedResourceCount()
            : tagRepository.searchActiveTagsWithApprovedResourceCount(normalizedSearch);

        return tags
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagCreateResponse createTag(TagRequest request) {
        String normalizedName = normalizeName(request.name());
        Tag existingTag = tagRepository.findByNameIgnoreCase(normalizedName).orElse(null);

        if (existingTag != null) {
            if (Boolean.TRUE.equals(existingTag.getIsDeleted())) {
                return new TagCreateResponse("DELETED_EXISTS", existingTag.getId(), null);
            }
            throw new ConflictException("Tag name already exists");
        }

        Tag tag = new Tag();
        tag.setName(normalizedName);
        tag.setIsDeleted(false);

        Tag savedTag = tagRepository.save(tag);
        return new TagCreateResponse("CREATED", savedTag.getId(), toResponse(savedTag));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagResponse updateTag(Long id, TagRequest request) {
        Tag tag = findActiveTagOrThrow(id);
        String normalizedName = normalizeName(request.name());
        validateUniqueName(normalizedName, id);

        tag.setName(normalizedName);

        return toResponse(tagRepository.save(tag));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagResponse deleteTag(Long id) {
        Tag tag = findActiveTagOrThrow(id);
        tag.setIsDeleted(true);
        return toResponse(tagRepository.save(tag));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagResponse restoreTag(Long id) {
        Tag tag = tagRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));

        if (!Boolean.TRUE.equals(tag.getIsDeleted())) {
            return toResponse(tag);
        }

        boolean existsActiveDuplicate = tagRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(tag.getName(), id);
        if (existsActiveDuplicate) {
            throw new ConflictException("An active tag with the same name already exists");
        }

        tag.setIsDeleted(false);
        return toResponse(tagRepository.save(tag));
    }

    private Tag findActiveTagOrThrow(Long id) {
        return tagRepository.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));
    }

    private void validateUniqueName(String normalizedName, Long tagId) {
        boolean exists = tagId == null
            ? tagRepository.existsByNameIgnoreCaseAndIsDeletedFalse(normalizedName)
            : tagRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(normalizedName, tagId);
        if (exists) {
            throw new ConflictException("Tag name already exists");
        }
    }

    private String normalizeName(String rawName) {
        String normalizedName = rawName == null ? null : rawName.trim();
        if (normalizedName == null || normalizedName.isEmpty()) {
            throw new BusinessException("Tag name must not be empty");
        }
        return normalizedName;
    }

    private TagResponse toResponse(Tag tag) {
        return new TagResponse(
            tag.getId(),
            tag.getName(),
            tag.getIsDeleted(),
            tag.getCreatedAt(),
            tagRepository.countApprovedResourcesByTagId(tag.getId())
        );
    }

    private TagResponse toResponse(TagUsageRow tag) {
        return new TagResponse(
            tag.getId(),
            tag.getName(),
            tag.getIsDeleted(),
            tag.getCreatedAt(),
            tag.getApprovedResourceCount() == null ? 0 : tag.getApprovedResourceCount()
        );
    }
}
