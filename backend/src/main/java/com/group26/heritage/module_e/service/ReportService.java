package com.group26.heritage.module_e.service;

import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.CategoryDashboardItem;
import com.group26.heritage.module_e.dto.CategoryDashboardResponse;
import com.group26.heritage.module_e.dto.StatusDashboardItem;
import com.group26.heritage.module_e.dto.StatusDashboardResponse;
import com.group26.heritage.module_e.dto.StatusDashboardRow;
import com.group26.heritage.module_e.dto.WorkflowStageItem;
import com.group26.heritage.module_e.dto.WorkflowSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ReportService {

    private static final List<ResourceStatus> WORKFLOW_STATUSES = List.of(
            ResourceStatus.PENDING_REVIEW,
            ResourceStatus.APPROVED,
            ResourceStatus.REJECTED,
            ResourceStatus.ARCHIVED
    );

    private final ResourceRepository resourceRepository;

    public ReportService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // PBI 5.5 / Task 1: Build resource status distribution and workflow bottleneck data.
    @Transactional(readOnly = true)
    public StatusDashboardResponse getStatusDashboard() {
        Map<ResourceStatus, Long> countsByStatus = new EnumMap<>(ResourceStatus.class);
        for (ResourceStatus status : ResourceStatus.values()) {
            countsByStatus.put(status, 0L);
        }

        for (StatusDashboardRow row : resourceRepository.countResourcesByStatusForDashboard()) {
            ResourceStatus status = ResourceStatus.valueOf(row.getStatus());
            countsByStatus.put(status, safeCount(row.getCount()));
        }

        long total = countsByStatus.values().stream()
                .mapToLong(Long::longValue)
                .sum();

        WorkflowSummary workflow = buildWorkflowSummary(countsByStatus);
        Set<String> bottleneckKeys = workflow.bottleneckStage() == null
                ? Set.of()
                : Set.of(workflow.bottleneckStage());

        List<StatusDashboardItem> items = countsByStatus.entrySet().stream()
                .map(entry -> new StatusDashboardItem(
                        entry.getKey().name(),
                        toDisplayLabel(entry.getKey().name()),
                        entry.getValue(),
                        calculateRatio(entry.getValue(), total),
                        WORKFLOW_STATUSES.contains(entry.getKey()),
                        bottleneckKeys.contains(entry.getKey().name())
                ))
                .toList();

        return new StatusDashboardResponse(total, items, workflow, LocalDateTime.now());
    }

    // PBI 5.5 / Task 1: Build category resource distribution data.
    @Transactional(readOnly = true)
    public CategoryDashboardResponse getCategoryDashboard() {
        var rows = resourceRepository.countResourcesByCategoryForDashboard();
        long total = rows.stream()
                .mapToLong(row -> safeCount(row.getCount()))
                .sum();

        List<CategoryDashboardItem> items = rows.stream()
                .map(row -> {
                    long count = safeCount(row.getCount());
                    return new CategoryDashboardItem(
                            row.getCategoryId(),
                            row.getCategoryName(),
                            row.getCategoryStatus(),
                            count,
                            calculateRatio(count, total)
                    );
                })
                .toList();

        return new CategoryDashboardResponse(total, items, LocalDateTime.now());
    }

    private WorkflowSummary buildWorkflowSummary(Map<ResourceStatus, Long> countsByStatus) {
        long workflowTotal = WORKFLOW_STATUSES.stream()
                .mapToLong(status -> countsByStatus.getOrDefault(status, 0L))
                .sum();

        ResourceStatus bottleneckStatus = WORKFLOW_STATUSES.stream()
                .max((left, right) -> Long.compare(
                        countsByStatus.getOrDefault(left, 0L),
                        countsByStatus.getOrDefault(right, 0L)
                ))
                .orElse(null);

        long bottleneckCount = bottleneckStatus == null
                ? 0L
                : countsByStatus.getOrDefault(bottleneckStatus, 0L);

        if (bottleneckCount == 0L) {
            bottleneckStatus = null;
        }

        ResourceStatus finalBottleneckStatus = bottleneckStatus;
        List<WorkflowStageItem> stages = WORKFLOW_STATUSES.stream()
                .map(status -> {
                    long count = countsByStatus.getOrDefault(status, 0L);
                    return new WorkflowStageItem(
                            status.name(),
                            toDisplayLabel(status.name()),
                            count,
                            calculateRatio(count, workflowTotal),
                            status.equals(finalBottleneckStatus)
                    );
                })
                .toList();

        return new WorkflowSummary(
                stages,
                bottleneckStatus == null ? null : bottleneckStatus.name(),
                bottleneckStatus == null ? null : toDisplayLabel(bottleneckStatus.name()),
                bottleneckCount
        );
    }

    private long safeCount(Long count) {
        return count == null ? 0L : count;
    }

    private double calculateRatio(long count, long total) {
        if (total == 0L) {
            return 0.0;
        }
        return Math.round(((double) count * 10000.0) / total) / 100.0;
    }

    private String toDisplayLabel(String key) {
        String[] words = key.toLowerCase().split("_");
        StringBuilder label = new StringBuilder();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            if (label.length() > 0) {
                label.append(' ');
            }
            label.append(Character.toUpperCase(word.charAt(0)))
                    .append(word.substring(1));
        }
        return label.toString();
    }
}
