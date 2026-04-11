package com.group26.heritage.common.exception;

/**
 * 表示可预期的业务校验异常。
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
