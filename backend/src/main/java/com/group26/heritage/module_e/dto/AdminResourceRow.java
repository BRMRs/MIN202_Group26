package com.group26.heritage.module_e.dto;

import java.time.LocalDateTime;

public interface AdminResourceRow {
    Long getId();

    String getTitle();

    String getDescription();

    Long getContributorId();

    Long getCategoryId();

    String getCategoryName();

    String getCategoryStatus();

    String getStatus();

    String getArchiveReason();

    String getPlace();

    String getExternalLink();

    String getCopyrightDeclaration();

    LocalDateTime getCreatedAt();

    LocalDateTime getUpdatedAt();

    String getTags();
}
