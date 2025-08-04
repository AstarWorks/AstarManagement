package com.astarworks.astarmanagement.application.port.input

import com.astarworks.astarmanagement.application.dto.auth.LoginRequest
import com.astarworks.astarmanagement.application.dto.auth.LoginResponse
import com.astarworks.astarmanagement.application.dto.auth.RegisterRequest
import com.astarworks.astarmanagement.application.dto.auth.UserResponse

interface AuthenticationUseCase {
    fun login(request: LoginRequest): LoginResponse
    fun register(request: RegisterRequest): UserResponse
    fun validateToken(token: String): Boolean
    fun refreshToken(refreshToken: String): LoginResponse
}