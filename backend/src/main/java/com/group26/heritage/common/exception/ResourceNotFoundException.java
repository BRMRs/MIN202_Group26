package com.group26.heritage.common.exception;

/**
 * Thrown when a requested resource (entity) is not found.
 * TODO: Use in all module services when entity lookup returns empty Optional
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
