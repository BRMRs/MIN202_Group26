package com.group26.heritage.module_e.dto;

import java.time.LocalDateTime;

public interface AdminResourceMediaRow {
    Long getId();

    String getMediaType();

    String getFileUrl();

    String getFileName();

    Long getFileSize();

    String getMimeType();

    Integer getSortOrder();

    LocalDateTime getUploadedAt();
}
