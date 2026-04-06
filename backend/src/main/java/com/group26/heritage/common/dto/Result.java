package com.group26.heritage.common.dto;

/**
 * 统一接口返回结构。
 */
public record Result<T>(boolean success, String message, T data) {

    public static <T> Result<T> success(T data) {
        return new Result<>(true, "操作成功", data);
    }

    public static <T> Result<T> success(String message, T data) {
        return new Result<>(true, message, data);
    }

    public static Result<Void> success(String message) {
        return new Result<>(true, message, null);
    }

    public static Result<Void> failure(String message) {
        return new Result<>(false, message, null);
    }
}
