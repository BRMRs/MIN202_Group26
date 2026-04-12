package com.group26.heritage.module_d.controller;

import com.group26.heritage.module_d.dto.CommentRequest;
import com.group26.heritage.module_d.dto.CommentResponseDto;
import com.group26.heritage.module_d.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Comment Controller — Module D
 * D-PBI 5: Basic Commenting and Feedback
 */
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * GET /api/comments/resource/{resourceId}
     */
    @GetMapping("/resource/{resourceId}")
    public List<CommentResponseDto> getComments(@PathVariable Long resourceId) {
        return commentService.getCommentsForResource(resourceId);
    }

    /**
     * POST /api/comments/resource/{resourceId}
     * Requires Authorization: Bearer (Module A JWT).
     */
    @PostMapping("/resource/{resourceId}")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable Long resourceId,
            @RequestBody CommentRequest body
    ) {
        Long userId = CommentService.requireCurrentUserId();
        String content = body != null ? body.getContent() : null;
        Map<String, Object> result = commentService.addComment(resourceId, userId, content);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/comments/{resourceId}/like
     */
    @PostMapping("/{resourceId}/like")
    public ResponseEntity<Map<String, String>> like(@PathVariable Long resourceId) {
        Long userId = CommentService.requireCurrentUserId();
        commentService.likeResource(resourceId, userId);
        return ResponseEntity.ok(Map.of("message", "Liked"));
    }

    /**
     * DELETE /api/comments/{resourceId}/unlike
     */
    @DeleteMapping("/{resourceId}/unlike")
    public ResponseEntity<Map<String, String>> unlike(@PathVariable Long resourceId) {
        Long userId = CommentService.requireCurrentUserId();
        commentService.unlikeResource(resourceId, userId);
        return ResponseEntity.ok(Map.of("message", "Unliked"));
    }

    /**
     * GET /api/comments/{resourceId}/liked — whether current user liked (no auth → liked=false).
     */
    @GetMapping("/{resourceId}/liked")
    public Map<String, Object> likedState(@PathVariable Long resourceId) {
        return CommentService.optionalCurrentUserId()
                .map(uid -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("liked", commentService.hasUserLiked(resourceId, uid));
                    m.put("authenticated", true);
                    return m;
                })
                .orElseGet(() -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("liked", false);
                    m.put("authenticated", false);
                    return m;
                });
    }
}
