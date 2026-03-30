package com.group26.heritage.module_d.service;

import com.group26.heritage.common.dto.PageResult;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.Tag;
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

    /** Cached after first check; some DBs may not have resource_tags yet. */
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

    public PageResult<ResourceSummaryDto> searchByKeyword(
            String keyword,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        String normalizedKeyword = normalizeKeyword(keyword);
        return queryResources(normalizedKeyword, null, null, page, size, sortBy, direction);
    }

    public PageResult<ResourceSummaryDto> filterByCategoryAndTags(
            Long categoryId,
            List<Long> tagIds,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        List<Long> normalizedTagIds = normalizeTagIds(tagIds);
        return queryResources(null, categoryId, normalizedTagIds, page, size, sortBy, direction);
    }

    public PageResult<ResourceSummaryDto> searchAndFilter(
            String keyword,
            Long categoryId,
            List<Long> tagIds,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        String normalizedKeyword = normalizeKeyword(keyword);
        List<Long> normalizedTagIds = normalizeTagIds(tagIds);
        return queryResources(normalizedKeyword, categoryId, normalizedTagIds, page, size, sortBy, direction);
    }

    public ResourceDetailDto getResourceDetail(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .filter(r -> r.getStatus() == ResourceStatus.APPROVED)
                .orElseThrow(() -> new NoSuchElementException("Approved resource not found: " + resourceId));

        String categoryName = categoryRepository.findById(resource.getCategoryId())
                .map(Category::getName)
                .orElse(null);

        List<TagOptionDto> tags = getTagsForResourceIds(List.of(resource.getId()))
                .getOrDefault(resource.getId(), Collections.emptyList());

        return toResourceDetail(resource, categoryName, tags);
    }

    public List<CategoryOptionDto> listCategories() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(Category::getName, String.CASE_INSENSITIVE_ORDER))
                .map(c -> new CategoryOptionDto(c.getId(), c.getName()))
                .toList();
    }

    public List<TagOptionDto> listTags() {
        return tagRepository.findAll().stream()
                .sorted(Comparator.comparing(Tag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(t -> new TagOptionDto(t.getId(), t.getName()))
                .toList();
    }

    private PageResult<ResourceSummaryDto> queryResources(
            String keyword,
            Long categoryId,
            List<Long> tagIds,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = normalizePageSize(size);
        String normalizedSortBy = normalizeSortBy(sortBy);
        String normalizedDirection = normalizeDirection(direction);

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
                // Schema may lack resource_tags; behave like "no rows match" instead of failing the query.
                return new PageResult<>(Collections.emptyList(), normalizedPage, normalizedSize, 0L, 0);
            }
            whereSql.append(" AND r.id IN (")
                    .append("SELECT rt.resource_id FROM resource_tags rt WHERE rt.tag_id IN :tagIds ")
                    .append("GROUP BY rt.resource_id HAVING COUNT(DISTINCT rt.tag_id) = :tagCount")
                    .append(") ");
            params.put("tagIds", tagIds);
            params.put("tagCount", (long) tagIds.size());
        }

        String orderBy = buildOrderBy(normalizedSortBy, normalizedDirection);

        String selectSql = "SELECT * FROM resources r" + whereSql + orderBy + "LIMIT :limit OFFSET :offset";
        String countSql = "SELECT COUNT(*) FROM resources r" + whereSql;

        var selectQuery = entityManager.createNativeQuery(selectSql, Resource.class);
        var countQuery = entityManager.createNativeQuery(countSql);

        applyParams(selectQuery, params);
        applyParams(countQuery, params);
        selectQuery.setParameter("limit", normalizedSize);
        selectQuery.setParameter("offset", normalizedPage * normalizedSize);

        @SuppressWarnings("unchecked")
        List<Resource> resources = selectQuery.getResultList();

        long totalElements = ((Number) countQuery.getSingleResult()).longValue();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);

        Map<Long, String> categoryNameMap = getCategoryNameMap(resources);
        Map<Long, List<TagOptionDto>> tagsMap = getTagsForResourceIds(resources.stream().map(Resource::getId).toList());
        Map<Long, Long> likeCountMap = getLikeCountMap(resources.stream().map(Resource::getId).toList());
        Map<Long, Long> commentCountMap = getCommentCountMap(resources.stream().map(Resource::getId).toList());

        List<ResourceSummaryDto> content = resources.stream()
                .map(resource -> toResourceSummary(
                        resource,
                        categoryNameMap.get(resource.getCategoryId()),
                        tagsMap.getOrDefault(resource.getId(), Collections.emptyList()),
                        likeCountMap.getOrDefault(resource.getId(), 0L),
                        commentCountMap.getOrDefault(resource.getId(), 0L)
                ))
                .toList();

        return new PageResult<>(content, normalizedPage, normalizedSize, totalElements, totalPages);
    }

    private boolean hasResourceTagsTable() {
        if (resourceTagsTableAvailable != null) {
            return resourceTagsTableAvailable;
        }
        synchronized (this) {
            if (resourceTagsTableAvailable != null) {
                return resourceTagsTableAvailable;
            }
            try {
                Object result = entityManager.createNativeQuery(
                                "SELECT COUNT(*) FROM information_schema.tables "
                                        + "WHERE table_schema = DATABASE() AND table_name = 'resource_tags'")
                        .getSingleResult();
                resourceTagsTableAvailable = ((Number) result).longValue() > 0;
            } catch (Exception ignored) {
                resourceTagsTableAvailable = false;
            }
            return resourceTagsTableAvailable;
        }
    }

    private void applyParams(jakarta.persistence.Query query, Map<String, Object> params) {
        params.forEach(query::setParameter);
    }

    private Map<Long, String> getCategoryNameMap(List<Resource> resources) {
        Set<Long> categoryIds = new HashSet<>();
        for (Resource resource : resources) {
            if (resource.getCategoryId() != null) {
                categoryIds.add(resource.getCategoryId());
            }
        }

        if (categoryIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, String> result = new HashMap<>();
        for (Category category : categoryRepository.findAllById(categoryIds)) {
            result.put(category.getId(), category.getName());
        }
        return result;
    }

    private Map<Long, List<TagOptionDto>> getTagsForResourceIds(List<Long> resourceIds) {
        if (resourceIds == null || resourceIds.isEmpty()) {
            return Collections.emptyMap();
        }

        try {
            String sql = "SELECT rt.resource_id, t.id, t.name " +
                    "FROM resource_tags rt JOIN tags t ON t.id = rt.tag_id " +
                    "WHERE rt.resource_id IN :resourceIds";

            var query = entityManager.createNativeQuery(sql);
            query.setParameter("resourceIds", resourceIds);
            List<?> rows = query.getResultList();

            Map<Long, List<TagOptionDto>> tagsByResource = new HashMap<>();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                Long resourceId = ((Number) cols[0]).longValue();
                Long tagId = ((Number) cols[1]).longValue();
                String tagName = (String) cols[2];
                tagsByResource.computeIfAbsent(resourceId, key -> new ArrayList<>())
                        .add(new TagOptionDto(tagId, tagName));
            }
            return tagsByResource;
        } catch (Exception ignored) {
            // Some local databases may not have resource_tags table yet.
            // Keep browse/search available by returning no tags.
            return Collections.emptyMap();
        }
    }

    private ResourceSummaryDto toResourceSummary(
            Resource resource,
            String categoryName,
            List<TagOptionDto> tags,
            Long likeCount,
            Long commentCount
    ) {
        return new ResourceSummaryDto(
                resource.getId(),
                resource.getTitle(),
                resource.getDescription(),
                resource.getPlace(),
                resource.getFileUrl(),
                resource.getExternalLink(),
                categoryName,
                tags,
                likeCount,
                commentCount,
                resource.getCreatedAt()
        );
    }

    private ResourceDetailDto toResourceDetail(Resource resource, String categoryName, List<TagOptionDto> tags) {
        return new ResourceDetailDto(
                resource.getId(),
                resource.getTitle(),
                resource.getDescription(),
                resource.getPlace(),
                resource.getFileUrl(),
                resource.getExternalLink(),
                resource.getCopyrightDeclaration(),
                categoryName,
                tags,
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }

    private int normalizePageSize(int size) {
        if (size <= 0) {
            return 12;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String normalizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "createdAt";
        }
        return ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
    }

    private String normalizeDirection(String direction) {
        if (direction == null || direction.isBlank()) {
            return "DESC";
        }
        return "ASC".equalsIgnoreCase(direction) ? "ASC" : "DESC";
    }

    private String toColumnName(String field) {
        return switch (field) {
            case "id" -> "id";
            case "title" -> "title";
            default -> "created_at";
        };
    }

    private String buildOrderBy(String sortBy, String direction) {
        if ("interaction".equals(sortBy)) {
            // Temporary interaction proxy for Module D demo:
            // use resource id order to simulate "most interactive" ranking.
            return " ORDER BY r.id " + direction + " ";
        }
        return " ORDER BY r." + toColumnName(sortBy) + " " + direction + " ";
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<Long> normalizeTagIds(List<Long> tagIds) {
        if (tagIds == null) {
            return Collections.emptyList();
        }

        return tagIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private Map<Long, Long> getLikeCountMap(List<Long> resourceIds) {
        return getCountByResourceIds(resourceIds, "likes");
    }

    private Map<Long, Long> getCommentCountMap(List<Long> resourceIds) {
        return getCountByResourceIds(resourceIds, "comments");
    }

    private Map<Long, Long> getCountByResourceIds(List<Long> resourceIds, String tableName) {
        if (resourceIds == null || resourceIds.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            String sql = "SELECT resource_id, COUNT(*) FROM " + tableName + " WHERE resource_id IN :resourceIds GROUP BY resource_id";
            var query = entityManager.createNativeQuery(sql);
            query.setParameter("resourceIds", resourceIds);
            List<?> rows = query.getResultList();

            Map<Long, Long> countMap = new HashMap<>();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                Long resourceId = ((Number) cols[0]).longValue();
                Long count = ((Number) cols[1]).longValue();
                countMap.put(resourceId, count);
            }
            return countMap;
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }
}
