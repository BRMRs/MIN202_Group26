package com.group26.heritage.module_e.controller;

import com.group26.heritage.common.dto.Result;
import com.group26.heritage.entity.User;
import com.group26.heritage.module_e.dto.CategoryDashboardResponse;
import com.group26.heritage.module_e.dto.ContributorDashboardResponse;
import com.group26.heritage.module_e.dto.ReportFileResponse;
import com.group26.heritage.module_e.dto.StatusDashboardResponse;
import com.group26.heritage.module_e.dto.TagDashboardResponse;
import com.group26.heritage.module_e.dto.WorkflowSummary;
import com.group26.heritage.module_e.service.ReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock
    private ReportService reportService;

    @InjectMocks
    private DashboardController dashboardController;

    @Test
    void getStatusDashboardWrapsServiceData() {
        StatusDashboardResponse response = new StatusDashboardResponse(
            0L,
            List.of(),
            new WorkflowSummary(List.of(), null, null, 0L),
            LocalDateTime.now()
        );
        when(reportService.getStatusDashboard()).thenReturn(response);

        Result<StatusDashboardResponse> result = dashboardController.getStatusDashboard();

        assertThat(result.success()).isTrue();
        assertThat(result.data()).isEqualTo(response);
        verify(reportService).getStatusDashboard();
    }

    @Test
    void getCategoryDashboardWrapsServiceData() {
        CategoryDashboardResponse response = new CategoryDashboardResponse(0L, List.of(), LocalDateTime.now());
        when(reportService.getCategoryDashboard()).thenReturn(response);

        Result<CategoryDashboardResponse> result = dashboardController.getCategoryDashboard();

        assertThat(result.success()).isTrue();
        assertThat(result.data()).isEqualTo(response);
        verify(reportService).getCategoryDashboard();
    }

    @Test
    void getTagDashboardWrapsServiceData() {
        TagDashboardResponse response = new TagDashboardResponse(0L, List.of(), LocalDateTime.now());
        when(reportService.getTagDashboard()).thenReturn(response);

        Result<TagDashboardResponse> result = dashboardController.getTagDashboard();

        assertThat(result.success()).isTrue();
        assertThat(result.data()).isEqualTo(response);
        verify(reportService).getTagDashboard();
    }

    @Test
    void getContributorDashboardWrapsServiceData() {
        ContributorDashboardResponse response = new ContributorDashboardResponse(0L, List.of(), LocalDateTime.now());
        when(reportService.getContributorDashboard()).thenReturn(response);

        Result<ContributorDashboardResponse> result = dashboardController.getContributorDashboard();

        assertThat(result.success()).isTrue();
        assertThat(result.data()).isEqualTo(response);
        verify(reportService).getContributorDashboard();
    }

    @Test
    void downloadStatusDashboardReportReturnsCsvHeadersAndBody() {
        User admin = new User();
        byte[] content = "Status,Count\nApproved,2\n".getBytes(StandardCharsets.UTF_8);
        ReportFileResponse report = new ReportFileResponse(
            "resource-status-dashboard-report.csv",
            "text/csv; charset=UTF-8",
            content
        );
        when(reportService.generateStatusDashboardCsvReport(admin)).thenReturn(report);

        ResponseEntity<byte[]> response = dashboardController.downloadStatusDashboardReport(admin);

        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
            .isEqualTo("attachment; filename=\"resource-status-dashboard-report.csv\"");
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE))
            .isEqualTo("text/csv; charset=UTF-8");
        assertThat(response.getBody()).isEqualTo(content);
        verify(reportService).generateStatusDashboardCsvReport(admin);
    }

    @Test
    void downloadCategoryDashboardReportReturnsCsvHeadersAndBody() {
        User admin = new User();
        byte[] content = "Category,Count\nMusic,3\n".getBytes(StandardCharsets.UTF_8);
        ReportFileResponse report = new ReportFileResponse(
            "category-dashboard-report.csv",
            "text/csv; charset=UTF-8",
            content
        );
        when(reportService.generateCategoryDashboardCsvReport(admin)).thenReturn(report);

        ResponseEntity<byte[]> response = dashboardController.downloadCategoryDashboardReport(admin);

        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
            .isEqualTo("attachment; filename=\"category-dashboard-report.csv\"");
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE))
            .isEqualTo("text/csv; charset=UTF-8");
        assertThat(response.getBody()).isEqualTo(content);
        verify(reportService).generateCategoryDashboardCsvReport(admin);
    }
}
