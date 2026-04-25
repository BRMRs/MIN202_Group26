package com.group26.heritage.module_a.dto;

import com.group26.heritage.entity.enums.ApplicationStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ContributorApplicationDetailResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private ApplicationStatus status;
    private String reason;
    private String rejectReason;
    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;
    private Long adminId;
    private List<FileDto> files;

    @Data
    public static class FileDto {
        private Long id;
        private String fileUrl;
        private String fileName;
        private Long fileSize;
        private String mimeType;
        private Integer sortOrder;
        private LocalDateTime uploadedAt;
    }
}
