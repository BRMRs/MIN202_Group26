package com.group26.heritage.module_a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VerifyCodeRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    @Size(min = 6, max = 6)
    private String code;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
