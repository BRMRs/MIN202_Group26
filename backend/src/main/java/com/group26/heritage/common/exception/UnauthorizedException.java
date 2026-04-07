package com.group26.heritage.common.exception;

/**
 * Thrown when a user attempts an action they are not authorized for.
 * TODO: Use in module services for role-based access control checks
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
