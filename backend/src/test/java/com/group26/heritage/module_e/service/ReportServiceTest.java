package com.group26.heritage.module_e.service;

import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.CategoryDashboardResponse;
import com.group26.heritage.module_e.dto.CategoryDashboardRow;
import com.group26.heritage.module_e.dto.ContributorDashboardResponse;
import com.group26.heritage.module_e.dto.ContributorDashboardRow;
import com.group26.heritage.module_e.dto.ReportFileResponse;
import com.group26.heritage.module_e.dto.StatusDashboardResponse;
import com.group26.heritage.module_e.dto.StatusDashboardRow;
import com.group26.heritage.module_e.dto.TagDashboardResponse;
import com.group26.heritage.module_e.dto.TagUsageRow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private ReportService reportService;

    @Test
    void getStatusDashboardCalculatesTotalsRatiosAndPendingReviewBottleneck() {
        when(resourceRepository.countResourcesByStatusForDashboard()).thenReturn(List.of(
            statusRow(ResourceStatus.DRAFT.name(), 1L),
            statusRow(ResourceStatus.PENDING_REVIEW.name(), 2L),
            statusRow(ResourceStatus.APPROVED.name(), 1L)
        ));

        StatusDashboardResponse response = reportService.getStatusDashboard();

        assertThat(response.total()).isEqualTo(4L);
        assertThat(response.items())
            .filteredOn(item -> item.key().equals(ResourceStatus.PENDING_REVIEW.name()))
            .singleElement()
            .satisfies(item -> {
                assertThat(item.count()).isEqualTo(2L);
                assertThat(item.ratio()).isEqualTo(50.0);
                assertThat(item.bottleneck()).isTrue();
            });
        assertThat(response.workflow().bottleneckStage()).isEqualTo(ResourceStatus.PENDING_REVIEW.name());
        assertThat(response.workflow().bottleneckCount()).isEqualTo(2L);
    }

    @Test
    void getStatusDashboardReturnsZeroRatiosWhenNoResourcesExist() {
        when(resourceRepository.countResourcesByStatusForDashboard()).thenReturn(List.of());

        StatusDashboardResponse response = reportService.getStatusDashboard();

        assertThat(response.total()).isZero();
        assertThat(response.items()).allSatisfy(item -> assertThat(item.ratio()).isZero());
        assertThat(response.workflow().bottleneckStage()).isNull();
    }

    @Test
    void getCategoryDashboardCalculatesCategoryDistribution() {
        when(resourceRepository.countResourcesByCategoryForDashboard()).thenReturn(List.of(
            categoryRow(1L, "Music", "ACTIVE", 3L),
            categoryRow(2L, "Dance", "INACTIVE", 1L)
        ));

        CategoryDashboardResponse response = reportService.getCategoryDashboard();

        assertThat(response.total()).isEqualTo(4L);
        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).categoryName()).isEqualTo("Music");
        assertThat(response.items().get(0).ratio()).isEqualTo(75.0);
        assertThat(response.items().get(1).ratio()).isEqualTo(25.0);
    }

    @Test
    void getTagDashboardCalculatesApprovedTaggedResourceRatios() {
        when(tagRepository.findActiveTagsByApprovedResourceCountForDashboard()).thenReturn(List.of(
            tagUsageRow(1L, "Festival", false, 2L),
            tagUsageRow(2L, "Craft", false, 1L)
        ));

        TagDashboardResponse response = reportService.getTagDashboard();

        assertThat(response.totalApprovedTaggedResources()).isEqualTo(3L);
        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).tagName()).isEqualTo("Festival");
        assertThat(response.items().get(0).ratio()).isEqualTo(66.67);
        assertThat(response.items().get(1).ratio()).isEqualTo(33.33);
    }

    @Test
    void getContributorDashboardCalculatesSubmittedResourceRatios() {
        when(resourceRepository.countSubmittedResourcesByContributorForDashboard()).thenReturn(List.of(
            contributorRow(1L, "alice", 3L),
            contributorRow(2L, "bob", 1L)
        ));

        ContributorDashboardResponse response = reportService.getContributorDashboard();

        assertThat(response.total()).isEqualTo(4L);
        assertThat(response.items().get(0).contributorName()).isEqualTo("alice");
        assertThat(response.items().get(0).ratio()).isEqualTo(75.0);
        assertThat(response.items().get(1).ratio()).isEqualTo(25.0);
    }

    @Test
    void generateStatusDashboardCsvReportContainsAdminTotalsAndBottleneck() {
        when(resourceRepository.countResourcesByStatusForDashboard()).thenReturn(List.of(
            statusRow(ResourceStatus.PENDING_REVIEW.name(), 2L),
            statusRow(ResourceStatus.APPROVED.name(), 1L)
        ));
        User admin = new User();
        admin.setId(9L);
        admin.setUsername("admin");

        ReportFileResponse response = reportService.generateStatusDashboardCsvReport(admin);
        String csv = new String(response.content(), StandardCharsets.UTF_8);

        assertThat(response.filename()).isEqualTo("resource-status-dashboard-report.csv");
        assertThat(response.contentType()).isEqualTo("text/csv; charset=UTF-8");
        assertThat(csv).contains("Generated By,admin (ID: 9)");
        assertThat(csv).contains("Total Resources,3");
        assertThat(csv).contains("Workflow Bottleneck,Pending Review (2 resources)");
    }

    @Test
    void generateCategoryDashboardCsvReportEscapesCsvCells() {
        when(resourceRepository.countResourcesByCategoryForDashboard()).thenReturn(List.of(
            categoryRow(1L, "Music, Dance", "ACTIVE", 2L),
            categoryRow(2L, "Quote \"Art\"", "INACTIVE", 1L)
        ));

        ReportFileResponse response = reportService.generateCategoryDashboardCsvReport(null);
        String csv = new String(response.content(), StandardCharsets.UTF_8);

        assertThat(response.filename()).isEqualTo("category-dashboard-report.csv");
        assertThat(response.contentType()).isEqualTo("text/csv; charset=UTF-8");
        assertThat(csv).contains("Generated By,Unknown administrator");
        assertThat(csv).contains("1,\"Music, Dance\",ACTIVE,2,66.67%");
        assertThat(csv).contains("2,\"Quote \"\"Art\"\"\",INACTIVE,1,33.33%");
    }

    private static StatusDashboardRow statusRow(String status, Long count) {
        return new StatusDashboardRow() {
            @Override
            public String getStatus() {
                return status;
            }

            @Override
            public Long getCount() {
                return count;
            }
        };
    }

    private static CategoryDashboardRow categoryRow(Long id, String name, String status, Long count) {
        return new CategoryDashboardRow() {
            @Override
            public Long getCategoryId() {
                return id;
            }

            @Override
            public String getCategoryName() {
                return name;
            }

            @Override
            public String getCategoryStatus() {
                return status;
            }

            @Override
            public Long getCount() {
                return count;
            }
        };
    }

    private static TagUsageRow tagUsageRow(Long id, String name, Boolean deleted, Long count) {
        return new TagUsageRow() {
            @Override
            public Long getId() {
                return id;
            }

            @Override
            public String getName() {
                return name;
            }

            @Override
            public Boolean getIsDeleted() {
                return deleted;
            }

            @Override
            public LocalDateTime getCreatedAt() {
                return LocalDateTime.now();
            }

            @Override
            public Long getApprovedResourceCount() {
                return count;
            }
        };
    }

    private static ContributorDashboardRow contributorRow(Long id, String username, Long count) {
        return new ContributorDashboardRow() {
            @Override
            public Long getContributorId() {
                return id;
            }

            @Override
            public String getContributorName() {
                return username;
            }

            @Override
            public Long getCount() {
                return count;
            }
        };
    }
}
