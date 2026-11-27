
package com.atlasone.api.auth.controller;

import com.atlasone.api.auth.dto.LoginRequest;
import com.atlasone.api.auth.dto.LoginResponse;
import com.atlasone.api.auth.dto.RefreshTokenRequest;
import com.atlasone.api.auth.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        LoginResponse response = authService.refresh(
                request.refreshToken()
        );

        return ResponseEntity.ok(response);
    }
}
