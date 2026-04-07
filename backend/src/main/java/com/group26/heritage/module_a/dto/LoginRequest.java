package com.group26.heritage.module_a.dto;

import lombok.Data;

// fields sent by the client on login
@Data
public class LoginRequest {
    private String username;
    private String password;
}
