package com.group26.heritage.common.exception;

/**
 * Conflict exception for duplicate or incompatible requests.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
