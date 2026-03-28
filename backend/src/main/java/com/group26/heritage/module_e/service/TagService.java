package com.group26.heritage.module_e.service;

import com.group26.heritage.common.exception.BusinessException;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.Tag;
import com.group26.heritage.module_e.dto.TagRequest;
import com.group26.heritage.module_e.dto.TagResponse;
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

        List<Tag> tags = normalizedSearch.isEmpty()
            ? tagRepository.findAllByIsDeletedFalseOrderByNameAsc()
            : tagRepository.findByIsDeletedFalseAndNameContainingIgnoreCaseOrderByNameAsc(normalizedSearch);

        return tags
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagResponse createTag(TagRequest request) {
        String normalizedName = normalizeName(request.name());
        validateUniqueName(normalizedName, null);

        Tag tag = new Tag();
        tag.setName(normalizedName);
        tag.setDescription(normalizeDescription(request.description()));
        tag.setIsDeleted(false);

        return toResponse(tagRepository.save(tag));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagResponse updateTag(Long id, TagRequest request) {
        Tag tag = findActiveTagOrThrow(id);
        String normalizedName = normalizeName(request.name());
        validateUniqueName(normalizedName, id);

        tag.setName(normalizedName);
        tag.setDescription(normalizeDescription(request.description()));

        return toResponse(tagRepository.save(tag));
    }

    // PBI 5.2 / Task 2: Create tag CRUD and soft delete APIs
    @Transactional
    public TagResponse deleteTag(Long id) {
        Tag tag = findActiveTagOrThrow(id);
        tag.setIsDeleted(true);
        return toResponse(tagRepository.save(tag));
    }

    private Tag findActiveTagOrThrow(Long id) {
        return tagRepository.findByIdAndIsDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));
    }

    private void validateUniqueName(String normalizedName, Long tagId) {
        boolean exists = tagId == null
            ? tagRepository.existsByNameIgnoreCase(normalizedName)
            : tagRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, tagId);
        if (exists) {
            throw new BusinessException("Tag name already exists");
        }
    }

    private String normalizeName(String rawName) {
        String normalizedName = rawName == null ? null : rawName.trim();
        if (normalizedName == null || normalizedName.isEmpty()) {
            throw new BusinessException("Tag name must not be empty");
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

    private TagResponse toResponse(Tag tag) {
        return new TagResponse(
            tag.getId(),
            tag.getName(),
            tag.getDescription(),
            tag.getIsDeleted(),
            tag.getCreatedAt()
        );
    }
}
