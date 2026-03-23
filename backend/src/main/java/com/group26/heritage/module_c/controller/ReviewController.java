package com.group26.heritage.module_c.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Review Controller — Module C
 * Summary C-PBI 1 (Dashboard), C-PBI 2 (Approve/Reject), C-PBI 3 (Feedback), C-PBI 4 (Resubmission), C-PBI 5 (Archive)
 *
 * TODO: GET /api/reviews/pending — list pending resources for review (C-PBI 1)
 * TODO: GET /api/reviews/{resourceId} — get resource detail for review (C-PBI 1)
 * TODO: POST /api/reviews/{resourceId}/approve — approve resource (C-PBI 2)
 * TODO: POST /api/reviews/{resourceId}/reject — reject with mandatory feedback (C-PBI 2, C-PBI 3)
 * TODO: GET /api/reviews/{resourceId}/feedback — get review feedback history (C-PBI 3)
 * TODO: POST /api/reviews/{resourceId}/archive — archive approved resource (C-PBI 5)
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    // TODO: inject ReviewService
    // TODO: implement endpoints
}
