package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.module_e.dto.CategoryDashboardResponse;
import com.group26.heritage.module_e.dto.StatusDashboardResponse;
import com.group26.heritage.module_e.service.ReportService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final ReportService reportService;

    public DashboardController(ReportService reportService) {
        this.reportService = reportService;
    }

    // PBI 5.5 / Task 1: Create resource status and workflow bottleneck dashboard API.
    @GetMapping("/status-overview")
    public Result<StatusDashboardResponse> getStatusDashboard() {
        return Result.success(reportService.getStatusDashboard());
    }

    // PBI 5.5 / Task 1: Create category distribution dashboard API.
    @GetMapping("/category-overview")
    public Result<CategoryDashboardResponse> getCategoryDashboard() {
        return Result.success(reportService.getCategoryDashboard());
    }
}
