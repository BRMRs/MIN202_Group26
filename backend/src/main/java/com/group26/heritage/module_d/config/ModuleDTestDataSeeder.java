package com.group26.heritage.module_d.config;

import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.Tag;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.entity.enums.ResourceStatus;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Module D test data seeder.
 *
 * Notes:
 * - This only inserts resources with "[TEST-D]" prefix in title.
 * - It is idempotent: if "[TEST-D]" resources already exist, it skips.
 * - Teammates can easily identify and delete these records later.
 */
@Component
public class ModuleDTestDataSeeder implements ApplicationRunner {
    private static final String TEST_PREFIX = "[TEST-D]";
    private Boolean hasResourceTagsTableCache;
    private Boolean hasLikesTableCache;
    private Boolean hasCommentsTableCache;

    private final ResourceRepository resourceRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final EntityManager entityManager;

    public ModuleDTestDataSeeder(
            ResourceRepository resourceRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            EntityManager entityManager
    ) {
        this.resourceRepository = resourceRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        LocalDateTime now = LocalDateTime.now();

        Category savedCategory = ensureCategory(now);
        Tag savedTagCity = ensureTag(TEST_PREFIX + " city", now);
        Tag savedTagCulture = ensureTag(TEST_PREFIX + " culture", now);
        Tag savedTagStory = ensureTag(TEST_PREFIX + " story", now);

        ensureResourceWithTags(
                TEST_PREFIX + " Old Town Gate",
                "Test approved resource for homepage and search demo.",
                savedCategory.getId(),
                now.minusHours(1),
                "https://picsum.photos/seed/test-d-1/300/200",
                List.of(savedTagCity.getId(), savedTagCulture.getId())
        ).acceptInteraction(16, 6, now);
        ensureResourceWithTags(
                TEST_PREFIX + " Traditional Festival",
                "Test approved resource with tag filtering demo.",
                savedCategory.getId(),
                now.minusHours(8),
                "https://picsum.photos/seed/test-d-2/300/200",
                List.of(savedTagCulture.getId())
        ).acceptInteraction(4, 2, now);
        ensureResourceWithTags(
                TEST_PREFIX + " Local Story Wall",
                "Test approved resource for keyword matching on story.",
                savedCategory.getId(),
                now.minusHours(3),
                "https://picsum.photos/seed/test-d-3/300/200",
                List.of(savedTagStory.getId())
        ).acceptInteraction(11, 5, now);
        ensureResourceWithTags(
                TEST_PREFIX + " Riverside Market",
                "Test approved resource for pagination check.",
                savedCategory.getId(),
                now.minusHours(10),
                null,
                List.of(savedTagCity.getId())
        ).acceptInteraction(2, 1, now);
        ensureResourceWithTags(
                TEST_PREFIX + " Folk Music Night",
                "Test approved resource to validate homepage title and image rendering.",
                savedCategory.getId(),
                now.minusHours(5),
                "https://picsum.photos/seed/test-d-5/300/200",
                List.of(savedTagCulture.getId(), savedTagStory.getId())
        ).acceptInteraction(18, 9, now);
        ensureResourceWithTags(
                TEST_PREFIX + " Ancient Bridge Notes",
                "Test approved resource without image for placeholder rendering.",
                savedCategory.getId(),
                now.minusHours(2),
                null,
                List.of(savedTagCity.getId())
        ).acceptInteraction(8, 3, now);
        ensureResourceWithTags(
                TEST_PREFIX + " Neighborhood Chronicle",
                "Test approved resource with image for second-page and sort tests.",
                savedCategory.getId(),
                now.minusHours(7),
                "https://picsum.photos/seed/test-d-7/300/200",
                List.of(savedTagStory.getId())
        ).acceptInteraction(6, 4, now);
    }

    private Category ensureCategory(LocalDateTime now) {
        String categoryName = TEST_PREFIX + " Architecture";
        return categoryRepository.findAll().stream()
                .filter(c -> categoryName.equals(c.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Category category = new Category();
                    category.setName(categoryName);
                    category.setDescription("Test category for Module D browse/search/filter demo");
                    category.setStatus(CategoryStatus.ACTIVE);
                    category.setCreatedAt(now);
                    return categoryRepository.save(category);
                });
    }

    private Tag ensureTag(String tagName, LocalDateTime now) {
        return tagRepository.findAll().stream()
                .filter(t -> tagName.equals(t.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Tag tag = new Tag();
                    tag.setName(tagName);
                    tag.setCreatedAt(now);
                    tag.setIsDeleted(false);
                    return tagRepository.save(tag);
                });
    }

    private SeededResource ensureResourceWithTags(
            String title,
            String description,
            Long categoryId,
            LocalDateTime createdAt,
            String fileUrl,
            List<Long> tagIds
    ) {
        Resource saved = resourceRepository.findAll().stream()
                .filter(r -> title.equals(r.getTitle()))
                .findFirst()
                .orElseGet(() -> {
                    Resource fresh = buildTestResource(title, description, categoryId, createdAt, fileUrl);
                    return resourceRepository.save(fresh);
                });

        // Keep test records deterministic across reruns for paging/sorting demos.
        saved.setDescription(description);
        saved.setCategoryId(categoryId);
        saved.setStatus(ResourceStatus.APPROVED);
        saved.setFilePath(fileUrl);
        saved.setCreatedAt(createdAt);
        saved.setUpdatedAt(createdAt);
        saved = resourceRepository.save(saved);

        linkTags(saved.getId(), tagIds);
        return new SeededResource(saved.getId());
    }

    private class SeededResource {
        private final Long resourceId;

        private SeededResource(Long resourceId) {
            this.resourceId = resourceId;
        }

        private void acceptInteraction(int likeCount, int commentCount, LocalDateTime now) {
            seedLikes(resourceId, likeCount, now);
            seedComments(resourceId, commentCount, now);
        }
    }

    private Resource buildTestResource(
            String title,
            String description,
            Long categoryId,
            LocalDateTime createdAt,
            String fileUrl
    ) {
        Resource resource = new Resource();
        resource.setTitle(title);
        resource.setDescription(description);
        resource.setCategoryId(categoryId);
        resource.setContributorId(1L);
        resource.setStatus(ResourceStatus.APPROVED);
        resource.setPlace("Suzhou");
        resource.setCopyrightDeclaration("TEST DATA ONLY");
        resource.setExternalLink("https://example.com/test-d");
        resource.setFilePath(fileUrl);
        resource.setCreatedAt(createdAt);
        resource.setUpdatedAt(createdAt);
        return resource;
    }

    private void linkTags(Long resourceId, List<Long> tagIds) {
        if (!hasResourceTagsTable()) {
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            List<Number> existingTagIds = entityManager.createNativeQuery("SELECT tag_id FROM resource_tags WHERE resource_id = :resourceId")
                    .setParameter("resourceId", resourceId)
                    .getResultList();
            List<Long> existing = new ArrayList<>();
            for (Number value : existingTagIds) {
                existing.add(value.longValue());
            }

            for (Long tagId : tagIds) {
                if (existing.contains(tagId)) {
                    continue;
                }
                entityManager.createNativeQuery("INSERT INTO resource_tags (resource_id, tag_id) VALUES (:resourceId, :tagId)")
                        .setParameter("resourceId", resourceId)
                        .setParameter("tagId", tagId)
                        .executeUpdate();
            }
        } catch (Exception ignored) {
            // Some teammates' databases may not have resource_tags table yet.
            // Skip tag linking to keep demo data insertion non-blocking.
        }
    }

    private boolean hasResourceTagsTable() {
        if (hasResourceTagsTableCache != null) {
            return hasResourceTagsTableCache;
        }
        try {
            Object result = entityManager.createNativeQuery(
                            "SELECT COUNT(*) FROM information_schema.tables " +
                                    "WHERE table_schema = DATABASE() AND table_name = 'resource_tags'")
                    .getSingleResult();
            hasResourceTagsTableCache = ((Number) result).longValue() > 0;
        } catch (Exception ignored) {
            hasResourceTagsTableCache = false;
        }
        return hasResourceTagsTableCache;
    }

    private void seedLikes(Long resourceId, int likeCount, LocalDateTime now) {
        if (!hasLikesTable()) {
            return;
        }
        try {
            entityManager.createNativeQuery("DELETE FROM likes WHERE resource_id = :resourceId")
                    .setParameter("resourceId", resourceId)
                    .executeUpdate();
            for (int i = 0; i < likeCount; i++) {
                entityManager.createNativeQuery("INSERT INTO likes (user_id, resource_id, created_at) VALUES (:userId, :resourceId, :createdAt)")
                        .setParameter("userId", 1000L + i)
                        .setParameter("resourceId", resourceId)
                        .setParameter("createdAt", now.minusMinutes(i))
                        .executeUpdate();
            }
        } catch (Exception ignored) {
            // Keep seeding non-blocking in case schema differs.
        }
    }

    private void seedComments(Long resourceId, int commentCount, LocalDateTime now) {
        if (!hasCommentsTable()) {
            return;
        }
        try {
            entityManager.createNativeQuery("DELETE FROM comments WHERE resource_id = :resourceId AND content LIKE :testPrefix")
                    .setParameter("resourceId", resourceId)
                    .setParameter("testPrefix", TEST_PREFIX + "%")
                    .executeUpdate();
            for (int i = 0; i < commentCount; i++) {
                entityManager.createNativeQuery(
                                "INSERT INTO comments (resource_id, user_id, content, created_at) " +
                                        "VALUES (:resourceId, :userId, :content, :createdAt)")
                        .setParameter("resourceId", resourceId)
                        .setParameter("userId", 2000L + i)
                        .setParameter("content", TEST_PREFIX + " comment " + (i + 1))
                        .setParameter("createdAt", now.minusMinutes(i))
                        .executeUpdate();
            }
        } catch (Exception ignored) {
            // Keep seeding non-blocking in case schema differs.
        }
    }

    private boolean hasLikesTable() {
        if (hasLikesTableCache != null) {
            return hasLikesTableCache;
        }
        hasLikesTableCache = hasTable("likes");
        return hasLikesTableCache;
    }

    private boolean hasCommentsTable() {
        if (hasCommentsTableCache != null) {
            return hasCommentsTableCache;
        }
        hasCommentsTableCache = hasTable("comments");
        return hasCommentsTableCache;
    }

    private boolean hasTable(String tableName) {
        try {
            Object result = entityManager.createNativeQuery(
                            "SELECT COUNT(*) FROM information_schema.tables " +
                                    "WHERE table_schema = DATABASE() AND table_name = :tableName")
                    .setParameter("tableName", tableName)
                    .getSingleResult();
            return ((Number) result).longValue() > 0;
        } catch (Exception ignored) {
            return false;
        }
    }
}
