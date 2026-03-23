package com.group26.heritage.module_d.dto;

import lombok.Data;

/** Search/filter request DTO — Summary D-PBI 2, D-PBI 3 */
@Data
public class SearchRequest {
    private String keyword;
    private Long categoryId;
    private Long tagId;
    private int page = 0;
    private int size = 12;
    private String sortBy = "createdAt";
}
