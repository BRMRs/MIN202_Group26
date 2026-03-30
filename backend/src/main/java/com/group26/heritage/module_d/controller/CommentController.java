package com.group26.heritage.module_d.controller;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.common.repository.ResourceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Comment Controller — Module D
 * D-PBI 5: Basic Commenting and Feedback
 */
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @PersistenceContext
    private EntityManager entityManager;

    private final ResourceRepository resourceRepository;

    public CommentController(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    /**
     * GET /api/comments/resource/{resourceId}
     * Returns comments for a resource, newest first.
     */
    @GetMapping("/resource/{resourceId}")
    public List<Map<String, Object>> getComments(@PathVariable Long resourceId) {
        try {
            String sql = "SELECT c.id, c.content, c.created_at, u.id AS user_id, u.username " +
                         "FROM comments c JOIN users u ON c.user_id = u.id " +
                         "WHERE c.resource_id = :resourceId ORDER BY c.created_at DESC";
            var query = entityManager.createNativeQuery(sql);
            query.setParameter("resourceId", resourceId);
            List<?> rows = query.getResultList();

            List<Map<String, Object>> comments = new ArrayList<>();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                Map<String, Object> comment = new LinkedHashMap<>();
                comment.put("id", ((Number) cols[0]).longValue());
                comment.put("content", cols[1]);
                comment.put("createdAt", cols[2] != null ? cols[2].toString() : null);
                Map<String, Object> user = new LinkedHashMap<>();
                user.put("id", ((Number) cols[3]).longValue());
                user.put("username", cols[4]);
                comment.put("user", user);
                comments.add(comment);
            }
            return comments;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * POST /api/comments/resource/{resourceId}
     * Adds a new comment to a resource.
     * PBI 4.5: Prevent commenting if archived.
     */
    @PostMapping("/resource/{resourceId}")
    @Transactional
    public ResponseEntity<?> addComment(@PathVariable Long resourceId, @RequestBody Map<String, String> body) {
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Comment content cannot be empty"));
        }
        if (content.length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("message", "Comment exceeds 500 characters"));
        }

        Optional<Resource> resourceOpt = resourceRepository.findById(resourceId);
        if (resourceOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Resource not found"));
        }

        Resource resource = resourceOpt.get();
        if (resource.getStatus() == ResourceStatus.ARCHIVED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Cannot comment on archived resources"));
        }

        // TODO: replace with actual authenticated user from SecurityContext (Module A integration)
        Long userId = 1L;

        try {
            // ── 核心修复：必须调用 executeUpdate() 才能真正写入数据库 ──
            String insertSql = "INSERT INTO comments (resource_id, user_id, content, created_at) " +
                               "VALUES (:rId, :uId, :content, NOW())";
            var insertQuery = entityManager.createNativeQuery(insertSql);
            insertQuery.setParameter("rId", resourceId);
            insertQuery.setParameter("uId", userId);
            insertQuery.setParameter("content", content);
            insertQuery.executeUpdate(); // ← 这行之前缺失，导致评论从未保存

            // 获取刚插入的评论 ID 和时间（用于返回给前端）
            String selectSql = "SELECT c.id, c.content, c.created_at, u.id, u.username " +
                               "FROM comments c JOIN users u ON c.user_id = u.id " +
                               "WHERE c.resource_id = :rId ORDER BY c.id DESC LIMIT 1";
            var selectQuery = entityManager.createNativeQuery(selectSql);
            selectQuery.setParameter("rId", resourceId);
            List<?> rows = selectQuery.getResultList();

            if (!rows.isEmpty()) {
                Object[] cols = (Object[]) rows.get(0);
                Map<String, Object> newComment = new LinkedHashMap<>();
                newComment.put("id", ((Number) cols[0]).longValue());
                newComment.put("content", cols[1]);
                newComment.put("createdAt", cols[2] != null ? cols[2].toString() : null);
                Map<String, Object> userMap = new LinkedHashMap<>();
                userMap.put("id", ((Number) cols[3]).longValue());
                userMap.put("username", cols[4]);
                newComment.put("user", userMap);
                return ResponseEntity.ok(Map.of("message", "Comment added", "data", newComment));
            }

            return ResponseEntity.ok(Map.of(
                "message", "Comment added",
                "data", Map.of("id", System.currentTimeMillis(), "content", content,
                               "createdAt", java.time.LocalDateTime.now().toString(),
                               "user", Map.of("id", userId, "username", "CurrentUser"))
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error saving comment: " + e.getMessage()));
        }
    }
}
