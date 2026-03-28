package com.group26.heritage.module_e.dto;

import com.group26.heritage.entity.enums.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 分类新增/编辑请求参数。
 */
public record CategoryRequest(
    @NotBlank(message = "分类名称不能为空")
    @Size(max = 100, message = "分类名称长度不能超过100个字符")
    String name,

    @Size(max = 1000, message = "分类描述长度不能超过1000个字符")
    String description,

    @NotNull(message = "分类状态不能为空")
    CategoryStatus status
) {
}
