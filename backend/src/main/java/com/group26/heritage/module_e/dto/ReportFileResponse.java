package com.group26.heritage.module_e.dto;

public record ReportFileResponse(
        String filename,
        String contentType,
        byte[] content
) {
}
