package com.group26.heritage.module_b.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Resource Controller — Module B
 * Summary B-PBI 1 (Edit), B-PBI 2 (Draft), B-PBI 3 (Upload), B-PBI 4 (Submit), B-PBI 5 (Resubmit)
 *
 * TODO: POST /api/resources — create new resource (B-PBI 1)
 * TODO: PUT /api/resources/{id} — update resource metadata (B-PBI 1)
 * TODO: GET /api/resources/{id} — get resource by id
 * TODO: GET /api/resources/my — get contributor's own resources (B-PBI 2)
 * TODO: POST /api/resources/{id}/draft — save as draft (B-PBI 2)
 * TODO: POST /api/resources/{id}/submit — submit for review, status → PENDING_REVIEW (B-PBI 4)
 * TODO: PUT /api/resources/{id}/resubmit — resubmit rejected resource (B-PBI 5)
 * TODO: POST /api/resources/{id}/upload — upload file attachment (B-PBI 3)
 * TODO: DELETE /api/resources/{id} — delete draft resource
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {
    // TODO: inject ResourceService, FileStorageService
    // TODO: implement endpoints
}
