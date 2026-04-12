package com.group26.heritage.module_d.service;

import com.group26.heritage.common.dto.UserSummaryDto;
import com.group26.heritage.common.exception.UnauthorizedException;
import com.group26.heritage.common.repository.CommentRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.entity.Comment;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_d.dto.CommentResponseDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Comment & like actions — Module D (uses DB; no changes required in common repositories).
 */
@Service
public class CommentService {

    private static final int MAX_COMMENT_LENGTH = 500;

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public CommentService(
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            CommentRepository commentRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    public List<CommentResponseDto> getCommentsForResource(Long resourceId) {
        List<Comment> list = entityManager.createQuery(
                        "SELECT c FROM Comment c WHERE c.resourceId = :rid ORDER BY c.createdAt DESC",
                        Comment.class)
                .setParameter("rid", resourceId)
                .getResultList();

        List<CommentResponseDto> out = new ArrayList<>();
        DateTimeFormatter iso = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        for (Comment c : list) {
            UserSummaryDto userDto = userRepository.findById(c.getUserId())
                    .map(u -> new UserSummaryDto(u.getId(), u.getUsername(), u.getAvatarUrl()))
                    .orElse(new UserSummaryDto(c.getUserId(), "user" + c.getUserId(), null));
            String created = c.getCreatedAt() != null ? iso.format(c.getCreatedAt()) : null;
            out.add(new CommentResponseDto(c.getId(), c.getContent(), created, userDto));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> addComment(Long resourceId, Long userId, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content cannot be empty");
        }
        if (content.length() > MAX_COMMENT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment exceeds 500 characters");
        }

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        if (resource.getStatus() == ResourceStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot comment on archived resources");
        }
        if (resource.getStatus() != ResourceStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Comments are only allowed on approved resources");
        }

        Comment comment = new Comment();
        comment.setResourceId(resourceId);
        comment.setUserId(userId);
        comment.setContent(content.trim());
        comment.setCreatedAt(LocalDateTime.now());
        comment = commentRepository.save(comment);

        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "User not found"));
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id", u.getId());
        userMap.put("username", u.getUsername());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", comment.getId());
        data.put("content", comment.getContent());
        data.put("createdAt", comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null);
        data.put("user", userMap);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Comment added");
        body.put("data", data);
        return body;
    }

    @Transactional
    public void likeResource(Long resourceId, Long userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
        if (resource.getStatus() == ResourceStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot like archived resources");
        }

        if (likeExists(userId, resourceId)) {
            return;
        }
        String sql = "INSERT INTO likes (user_id, resource_id, created_at) VALUES (:uid, :rid, :ts)";
        var q = entityManager.createNativeQuery(sql);
        q.setParameter("uid", userId);
        q.setParameter("rid", resourceId);
        q.setParameter("ts", LocalDateTime.now());
        q.executeUpdate();
    }

    @Transactional
    public void unlikeResource(Long resourceId, Long userId) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        String sql = "DELETE FROM likes WHERE user_id = :uid AND resource_id = :rid";
        var q = entityManager.createNativeQuery(sql);
        q.setParameter("uid", userId);
        q.setParameter("rid", resourceId);
        q.executeUpdate();
    }

    public boolean hasUserLiked(Long resourceId, Long userId) {
        return likeExists(userId, resourceId);
    }

    private boolean likeExists(Long userId, Long resourceId) {
        try {
            String sql = "SELECT COUNT(*) FROM likes WHERE user_id = :uid AND resource_id = :rid";
            var q = entityManager.createNativeQuery(sql);
            q.setParameter("uid", userId);
            q.setParameter("rid", resourceId);
            Object single = q.getSingleResult();
            long n = single instanceof Number ? ((Number) single).longValue() : 0L;
            return n > 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static Long requireCurrentUserId() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required");
        }
        Object p = auth.getPrincipal();
        if (p instanceof User user) {
            return user.getId();
        }
        throw new UnauthorizedException("Authentication required");
    }

    public static Optional<Long> optionalCurrentUserId() {
        try {
            return Optional.of(requireCurrentUserId());
        } catch (UnauthorizedException e) {
            return Optional.empty();
        }
    }
}
