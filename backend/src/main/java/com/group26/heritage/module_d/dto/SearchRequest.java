package com.group26.heritage.module_d.dto;

import lombok.Data;

import java.util.List;

/** Search/filter request DTO — Summary D-PBI 2, D-PBI 3 */
@Data
public class SearchRequest {
    private String keyword;
    private Long categoryId;
    private List<Long> tagIds;
    private int page = 0;
    private int size = 12;
    private String sortBy = "createdAt";
    private String direction = "DESC";
}
