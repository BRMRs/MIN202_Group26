package com.group26.heritage.common.exception;

import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global Exception Handler — catches exceptions from all modules.
 * TODO: Handle MethodArgumentNotValidException (validation errors → 400)
 * TODO: Handle ResourceNotFoundException → 404
 * TODO: Handle UnauthorizedException → 401
 * TODO: Handle AccessDeniedException → 403
 * TODO: Handle generic Exception → 500
 * TODO: Return ApiResponse<Void> with error message
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    // TODO: implement exception handlers
}
