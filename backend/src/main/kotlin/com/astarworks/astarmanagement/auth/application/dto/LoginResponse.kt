package com.astarworks.astarmanagement.modules.auth.application.dto

import java.util.UUID

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserResponse
)