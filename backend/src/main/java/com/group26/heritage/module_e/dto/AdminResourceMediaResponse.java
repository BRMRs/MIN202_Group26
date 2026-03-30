package com.group26.heritage.module_e.dto;

import java.time.LocalDateTime;

public record AdminResourceMediaResponse(
    Long id,
    String mediaType,
    String fileUrl,
    String fileName,
    Long fileSize,
    String mimeType,
    Integer sortOrder,
    LocalDateTime uploadedAt
) {
}
