package com.group26.heritage.module_d.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Discover Controller — Module D
 * Summary D-PBI 1 (Browse), D-PBI 2 (Search), D-PBI 3 (Filter), D-PBI 4 (Detail)
 *
 * TODO: GET /api/discover/resources — browse approved resources, paginated, newest first (D-PBI 1)
 * TODO: GET /api/discover/resources/search?keyword= — search by title/description (D-PBI 2)
 * TODO: GET /api/discover/resources/filter?categoryId=&tagId= — filter by category/tag (D-PBI 3)
 * TODO: GET /api/discover/resources/{id} — get resource detail (D-PBI 4)
 */
@RestController
@RequestMapping("/api/discover")
public class DiscoverController {
    // TODO: inject SearchService
    // TODO: implement endpoints
}
