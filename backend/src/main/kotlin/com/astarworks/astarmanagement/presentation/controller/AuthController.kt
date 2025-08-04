package com.astarworks.astarmanagement.presentation.controller

import com.astarworks.astarmanagement.application.dto.auth.LoginRequest
import com.astarworks.astarmanagement.application.dto.auth.LoginResponse
import com.astarworks.astarmanagement.application.dto.auth.RegisterRequest
import com.astarworks.astarmanagement.application.dto.auth.UserResponse
import com.astarworks.astarmanagement.application.port.input.AuthenticationUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authenticationUseCase: AuthenticationUseCase
) {
    
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<LoginResponse> {
        return ResponseEntity.ok(authenticationUseCase.login(request))
    }
    
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<UserResponse> {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(authenticationUseCase.register(request))
    }
    
    @PostMapping("/refresh")
    fun refresh(@RequestHeader("Authorization") authHeader: String): ResponseEntity<LoginResponse> {
        val refreshToken = authHeader.removePrefix("Bearer ")
        return ResponseEntity.ok(authenticationUseCase.refreshToken(refreshToken))
    }
    
    @GetMapping("/validate")
    fun validate(@RequestHeader("Authorization") authHeader: String): ResponseEntity<Map<String, Boolean>> {
        val token = authHeader.removePrefix("Bearer ")
        val isValid = authenticationUseCase.validateToken(token)
        return ResponseEntity.ok(mapOf("valid" to isValid))
    }
}