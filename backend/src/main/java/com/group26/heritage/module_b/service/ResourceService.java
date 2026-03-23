package com.group26.heritage.module_b.service;

import org.springframework.stereotype.Service;

/**
 * Resource Service — Module B
 * TODO: Inject ResourceRepository, CategoryRepository, TagRepository
 * TODO: createResource(Long contributorId, ResourceCreateRequest) → Resource
 * TODO: updateResource(Long resourceId, Long contributorId, ResourceUpdateRequest) → Resource
 * TODO: saveDraft(Long resourceId, Long contributorId, ResourceUpdateRequest) → Resource
 * TODO: loadDraft(Long resourceId, Long contributorId) → Resource
 * TODO: submitForReview(Long resourceId, Long contributorId) — validate required fields, status → PENDING_REVIEW
 * TODO: resubmitResource(Long resourceId, Long contributorId, ResourceUpdateRequest) — status REJECTED → PENDING_REVIEW
 * TODO: deleteResource(Long resourceId, Long contributorId) — only DRAFT resources can be deleted
 */
@Service
public class ResourceService {
    // TODO: implement resource management logic
}
