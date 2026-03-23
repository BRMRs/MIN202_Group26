package com.group26.heritage.module_e.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard Controller — Module E
 * Summary E-PBI 3 (Content Status), E-PBI 4 (Dashboard), E-PBI 5 (Reporting)
 *
 * TODO: GET /api/admin/dashboard/stats — resource counts by status (E-PBI 4)
 * TODO: GET /api/admin/dashboard/reports?from=&to= — distribution report (E-PBI 5)
 * TODO: GET /api/admin/dashboard/reports/export — export CSV/Excel (E-PBI 5)
 * TODO: PUT /api/admin/dashboard/resources/{id}/status — override resource status (E-PBI 3)
 */
@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {
    // TODO: inject ReportService, CategoryService
    // TODO: implement endpoints
}
