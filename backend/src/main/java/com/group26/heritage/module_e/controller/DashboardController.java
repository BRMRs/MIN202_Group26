package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_e.dto.CategoryDashboardResponse;
import com.group26.heritage.module_e.dto.ReportFileResponse;
import com.group26.heritage.module_e.dto.StatusDashboardResponse;
import com.group26.heritage.module_e.dto.TagDashboardResponse;
import com.group26.heritage.module_e.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    // PBI 5.5 / Task 1: Create approved-resource tag popularity dashboard API.
    @GetMapping("/tag-overview")
    public Result<TagDashboardResponse> getTagDashboard() {
        return Result.success(reportService.getTagDashboard());
    }

    // PBI 5.5 / Task 2: Download the resource status and workflow bottleneck CSV report.
    @GetMapping("/status-overview/report")
    public ResponseEntity<byte[]> downloadStatusDashboardReport(@AuthenticationPrincipal User admin) {
        ReportFileResponse report = reportService.generateStatusDashboardCsvReport(admin);
        return buildFileResponse(report);
    }

    // PBI 5.5 / Task 2: Download the category distribution CSV report.
    @GetMapping("/category-overview/report")
    public ResponseEntity<byte[]> downloadCategoryDashboardReport(@AuthenticationPrincipal User admin) {
        ReportFileResponse report = reportService.generateCategoryDashboardCsvReport(admin);
        return buildFileResponse(report);
    }

    private ResponseEntity<byte[]> buildFileResponse(ReportFileResponse report) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.filename() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, report.contentType())
                .body(report.content());
    }
}
