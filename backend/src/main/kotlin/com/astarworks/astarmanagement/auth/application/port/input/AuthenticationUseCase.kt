package com.astarworks.astarmanagement.modules.auth.application.port.input

import com.astarworks.astarmanagement.modules.auth.application.dto.LoginRequest
import com.astarworks.astarmanagement.modules.auth.application.dto.LoginResponse
import com.astarworks.astarmanagement.modules.auth.application.dto.RegisterRequest
import com.astarworks.astarmanagement.modules.auth.application.dto.UserResponse

interface AuthenticationUseCase {
    fun login(request: LoginRequest): LoginResponse
    fun register(request: RegisterRequest): UserResponse
    fun validateToken(token: String): Boolean
    fun refreshToken(refreshToken: String): LoginResponse
}