package com.group26.heritage.module_a.dto;

import lombok.Data;

/** Registration request DTO — Summary A-PBI 1.1 */
@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
}
