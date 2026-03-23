package com.group26.heritage.module_a.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin User Controller — Module A
 * Summary A-PBI 1.5 (Admin Approval Workflow)
 *
 * TODO: GET /api/admin/users/applications — list pending contributor applications (A-PBI 1.5)
 * TODO: PUT /api/admin/users/applications/{id}/approve — approve application (A-PBI 1.5)
 * TODO: PUT /api/admin/users/applications/{id}/reject — reject application (A-PBI 1.5)
 * TODO: GET /api/admin/users — list all users (admin only)
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    // TODO: inject UserService
    // TODO: implement endpoints
}
