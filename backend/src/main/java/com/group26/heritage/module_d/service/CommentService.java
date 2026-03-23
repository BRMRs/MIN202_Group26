package com.group26.heritage.module_d.service;

import org.springframework.stereotype.Service;

/**
 * Comment Service — Module D
 * TODO: Inject CommentRepository, LikeRepository, ResourceRepository, UserRepository
 * TODO: getCommentsByResource(Long resourceId) → List<Comment>
 * TODO: addComment(Long resourceId, Long userId, String content) → Comment
 *   - Validate content length (max 500 chars — ValidationConstants.MAX_COMMENT_LENGTH)
 *   - Check resource is APPROVED (not ARCHIVED)
 * TODO: toggleLike(Long resourceId, Long userId) → boolean (true=liked, false=unliked)
 * TODO: getLikeCount(Long resourceId) → long
 */
@Service
public class CommentService {
    // TODO: implement comment and like logic
}
