package com.group26.heritage.module_a.dto;

import lombok.Data;

// fields sent by the client when creating a new account
@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
}
