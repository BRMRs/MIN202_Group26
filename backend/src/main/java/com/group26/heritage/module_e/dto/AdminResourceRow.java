package com.group26.heritage.module_e.dto;

import java.time.LocalDateTime;

public interface AdminResourceRow {
    Long getId();

    String getTitle();

    Long getCategoryId();

    String getCategoryName();

    String getCategoryStatus();

    String getContributorName();

    String getStatus();

    LocalDateTime getUpdatedAt();

    String getTags();
}
