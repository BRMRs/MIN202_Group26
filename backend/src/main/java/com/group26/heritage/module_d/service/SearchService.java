package com.group26.heritage.module_d.service;

import com.group26.heritage.common.dto.PageResult;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_d.dto.CategoryOptionDto;
import com.group26.heritage.module_d.dto.ResourceDetailDto;
import com.group26.heritage.module_d.dto.ResourceSummaryDto;
import com.group26.heritage.module_d.dto.TagOptionDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Search Service — Module D
 */
@Service
public class SearchService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "title", "id", "interaction");
    private static final int MAX_PAGE_SIZE = 100;

    private volatile Boolean resourceTagsTableAvailable;

    private final ResourceRepository resourceRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public SearchService(
            ResourceRepository resourceRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
    }

    public PageResult<ResourceSummaryDto> browseApproved(int page, int size, String sortBy, String direction) {
        return queryResources(null, null, null, page, size, sortBy, direction);
    }

    public PageResult<ResourceSummaryDto> searchByKeyword(String keyword, int page, int size, String sortBy, String direction) {
        return queryResources(normalizeKeyword(keyword), null, null, page, size, sortBy, direction);
    }

    public PageResult<ResourceSummaryDto> filterByCategoryAndTags(Long categoryId, List<Long> tagIds, int page, int size, String sortBy, String direction) {
        return queryResources(null, categoryId, normalizeTagIds(tagIds), page, size, sortBy, direction);
    }

    public PageResult<ResourceSummaryDto> searchAndFilter(String keyword, Long categoryId, List<Long> tagIds, int page, int size, String sortBy, String direction) {
        return queryResources(normalizeKeyword(keyword), categoryId, normalizeTagIds(tagIds), page, size, sortBy, direction);
    }

    public ResourceDetailDto getResourceDetail(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + resourceId));

        if (resource.getStatus() != ResourceStatus.APPROVED) {
            throw new NoSuchElementException("Approved resource not found: " + resourceId);
        }

        String categoryName = null;
        if (resource.getCategoryId() != null) {
            categoryName = categoryRepository.findById(resource.getCategoryId())
                    .map(c -> c.getName())
                    .orElse(null);
        }

        List<TagOptionDto> tags = getTagsForResourceIds(List.of(resource.getId()))
                .getOrDefault(resource.getId(), Collections.emptyList());

        List<ResourceDetailDto.MediaDto> media = getMediaForResource(resource.getId());

        long likeCount = getCountByResourceIds(List.of(resource.getId()), "likes")
                .getOrDefault(resource.getId(), 0L);
        long commentCount = getCountByResourceIds(List.of(resource.getId()), "comments")
                .getOrDefault(resource.getId(), 0L);

        return toResourceDetail(resource, categoryName, tags, media, (int) likeCount, (int) commentCount);
    }

    public List<CategoryOptionDto> listCategories() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(c -> c.getName(), String.CASE_INSENSITIVE_ORDER))
                .map(c -> new CategoryOptionDto(c.getId(), c.getName()))
                .toList();
    }

    public List<TagOptionDto> listTags() {
        return tagRepository.findAll().stream()
                .sorted(Comparator.comparing(t -> t.getName(), String.CASE_INSENSITIVE_ORDER))
                .map(t -> new TagOptionDto(t.getId(), t.getName()))
                .toList();
    }

    private PageResult<ResourceSummaryDto> queryResources(String keyword, Long categoryId, List<Long> tagIds, int page, int size, String sortBy, String direction) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = size <= 0 ? 12 : Math.min(size, MAX_PAGE_SIZE);
        String normalizedSortBy = (sortBy == null || !ALLOWED_SORT_FIELDS.contains(sortBy)) ? "createdAt" : sortBy;
        String normalizedDirection = "ASC".equalsIgnoreCase(direction) ? "ASC" : "DESC";

        StringBuilder whereSql = new StringBuilder(" WHERE r.status = :status ");
        Map<String, Object> params = new HashMap<>();
        params.put("status", ResourceStatus.APPROVED.name());

        if (keyword != null && !keyword.isBlank()) {
            whereSql.append(" AND (LOWER(r.title) LIKE :keyword OR LOWER(COALESCE(r.description, '')) LIKE :keyword) ");
            params.put("keyword", "%" + keyword.toLowerCase(Locale.ROOT) + "%");
        }

        if (categoryId != null) {
            whereSql.append(" AND r.category_id = :categoryId ");
            params.put("categoryId", categoryId);
        }

        if (tagIds != null && !tagIds.isEmpty()) {
            if (!hasResourceTagsTable()) {
                PageResult<ResourceSummaryDto> emptyResult = new PageResult<>();
                emptyResult.setContent(Collections.emptyList());
                emptyResult.setPage(normalizedPage);
                emptyResult.setSize(normalizedSize);
                emptyResult.setTotalElements(0L);
                emptyResult.setTotalPages(0);
                return emptyResult;
            }
            whereSql.append(" AND r.id IN (")
                    .append("SELECT rt.resource_id FROM resource_tags rt WHERE rt.tag_id IN :tagIds ")
                    .append("GROUP BY rt.resource_id HAVING COUNT(DISTINCT rt.tag_id) = :tagCount")
                    .append(") ");
            params.put("tagIds", tagIds);
            params.put("tagCount", (long) tagIds.size());
        }

        String orderCol = switch (normalizedSortBy) {
            case "id" -> "id";
            case "title" -> "title";
            default -> "created_at";
        };
        String orderBy = " ORDER BY r." + orderCol + " " + normalizedDirection + " ";

        String selectSql = "SELECT * FROM resources r" + whereSql + orderBy + "LIMIT :limit OFFSET :offset";
        String countSql = "SELECT COUNT(*) FROM resources r" + whereSql;

        var selectQuery = entityManager.createNativeQuery(selectSql, Resource.class);
        var countQuery = entityManager.createNativeQuery(countSql);

        params.forEach(selectQuery::setParameter);
        params.forEach(countQuery::setParameter);
        selectQuery.setParameter("limit", normalizedSize);
        selectQuery.setParameter("offset", normalizedPage * normalizedSize);

        @SuppressWarnings("unchecked")
        List<Resource> resources = selectQuery.getResultList();

        long totalElements = ((Number) countQuery.getSingleResult()).longValue();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);

        Map<Long, String> categoryNameMap = getCategoryNameMap(resources);
        List<Long> resourceIds = new ArrayList<>();
        for (Resource r : resources) {
            resourceIds.add(r.getId());
        }
        Map<Long, List<TagOptionDto>> tagsMap = getTagsForResourceIds(resourceIds);
        Map<Long, Long> likeCountMap = getLikeCountMap(resourceIds);
        Map<Long, Long> commentCountMap = getCommentCountMap(resourceIds);

        List<ResourceSummaryDto> content = new ArrayList<>();
        for (Resource r : resources) {
            content.add(new ResourceSummaryDto(
                    r.getId(),
                    r.getTitle(),
                    r.getDescription(),
                    r.getPlace(),
                    r.getFileUrl(),
                    r.getExternalLink(),
                    categoryNameMap.get(r.getCategoryId()),
                    tagsMap.getOrDefault(r.getId(), Collections.emptyList()),
                    likeCountMap.getOrDefault(r.getId(), 0L),
                    commentCountMap.getOrDefault(r.getId(), 0L),
                    r.getCreatedAt()
            ));
        }

        PageResult<ResourceSummaryDto> result = new PageResult<>();
        result.setContent(content);
        result.setPage(normalizedPage);
        result.setSize(normalizedSize);
        result.setTotalElements(totalElements);
        result.setTotalPages(totalPages);
        return result;
    }

    private boolean hasResourceTagsTable() {
        if (resourceTagsTableAvailable != null) return resourceTagsTableAvailable;
        synchronized (this) {
            if (resourceTagsTableAvailable != null) return resourceTagsTableAvailable;
            try {
                Object result = entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'resource_tags'")
                        .getSingleResult();
                resourceTagsTableAvailable = ((Number) result).longValue() > 0;
            } catch (Exception ignored) {
                resourceTagsTableAvailable = false;
            }
            return resourceTagsTableAvailable;
        }
    }

    private Map<Long, String> getCategoryNameMap(List<Resource> resources) {
        Set<Long> categoryIds = new HashSet<>();
        for (Resource r : resources) {
            if (r.getCategoryId() != null) categoryIds.add(r.getCategoryId());
        }
        if (categoryIds.isEmpty()) return Collections.emptyMap();
        Map<Long, String> result = new HashMap<>();
        for (Category c : categoryRepository.findAllById(categoryIds)) {
            result.put(c.getId(), c.getName());
        }
        return result;
    }

    private Map<Long, List<TagOptionDto>> getTagsForResourceIds(List<Long> resourceIds) {
        if (resourceIds == null || resourceIds.isEmpty()) return Collections.emptyMap();
        try {
            String sql = "SELECT rt.resource_id, t.id, t.name FROM resource_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.resource_id IN :resourceIds";
            var query = entityManager.createNativeQuery(sql);
            query.setParameter("resourceIds", resourceIds);
            List<?> rows = query.getResultList();
            Map<Long, List<TagOptionDto>> tagsByResource = new HashMap<>();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                Long rId = ((Number) cols[0]).longValue();
                Long tId = ((Number) cols[1]).longValue();
                String tName = (String) cols[2];
                tagsByResource.computeIfAbsent(rId, k -> new ArrayList<>()).add(new TagOptionDto(tId, tName));
            }
            return tagsByResource;
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }

    private ResourceDetailDto toResourceDetail(
            Resource r, String categoryName, List<TagOptionDto> tags,
            List<ResourceDetailDto.MediaDto> media, int likeCount, int commentCount) {
        return ResourceDetailDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .place(r.getPlace())
                .fileUrl(r.getFileUrl())
                .externalLink(r.getExternalLink())
                .copyrightDeclaration(r.getCopyrightDeclaration())
                .categoryName(categoryName)
                .tags(tags)
                .media(media)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .status(r.getStatus())
                .categoryId(r.getCategoryId())
                .build();
    }

    private List<ResourceDetailDto.MediaDto> getMediaForResource(Long resourceId) {
        try {
            String sql = "SELECT id, media_type, file_url, file_name FROM resource_media " +
                         "WHERE resource_id = :resourceId ORDER BY sort_order ASC";
            var query = entityManager.createNativeQuery(sql);
            query.setParameter("resourceId", resourceId);
            List<?> rows = query.getResultList();
            List<ResourceDetailDto.MediaDto> result = new ArrayList<>();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                ResourceDetailDto.MediaDto dto = new ResourceDetailDto.MediaDto();
                dto.setId(((Number) cols[0]).longValue());
                dto.setMediaType((String) cols[1]);
                dto.setFileUrl((String) cols[2]);
                dto.setFileName((String) cols[3]);
                result.add(dto);
            }
            // If resource_media table has no rows, fall back to file_url as single media item
            if (result.isEmpty()) {
                Resource resource = resourceRepository.findById(resourceId).orElse(null);
                if (resource != null && resource.getFileUrl() != null && !resource.getFileUrl().isBlank()) {
                    ResourceDetailDto.MediaDto dto = new ResourceDetailDto.MediaDto();
                    dto.setId(0L);
                    dto.setMediaType("COVER");
                    dto.setFileUrl(resource.getFileUrl());
                    dto.setFileName("cover.jpg");
                    result.add(dto);
                }
            }
            return result;
        } catch (Exception ignored) {
            return Collections.emptyList();
        }
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) return null;
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<Long> normalizeTagIds(List<Long> tagIds) {
        if (tagIds == null) return Collections.emptyList();
        List<Long> result = new ArrayList<>();
        for (Long id : tagIds) {
            if (id != null && !result.contains(id)) {
                result.add(id);
            }
        }
        return result;
    }

    private Map<Long, Long> getLikeCountMap(List<Long> resourceIds) {
        return getCountByResourceIds(resourceIds, "likes");
    }

    private Map<Long, Long> getCommentCountMap(List<Long> resourceIds) {
        return getCountByResourceIds(resourceIds, "comments");
    }

    private Map<Long, Long> getCountByResourceIds(List<Long> resourceIds, String tableName) {
        if (resourceIds == null || resourceIds.isEmpty()) return Collections.emptyMap();
        try {
            String sql = "SELECT resource_id, COUNT(*) FROM " + tableName + " WHERE resource_id IN :resourceIds GROUP BY resource_id";
            var query = entityManager.createNativeQuery(sql);
            query.setParameter("resourceIds", resourceIds);
            List<?> rows = query.getResultList();
            Map<Long, Long> countMap = new HashMap<>();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                countMap.put(((Number) cols[0]).longValue(), ((Number) cols[1]).longValue());
            }
            return countMap;
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }
}
