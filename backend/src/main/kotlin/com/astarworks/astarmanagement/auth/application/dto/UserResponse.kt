package com.astarworks.astarmanagement.modules.auth.application.dto

import com.astarworks.astarmanagement.modules.shared.domain.entity.UserRole
import java.time.LocalDateTime
import java.util.UUID

data class UserResponse(
    val id: UUID,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val isActive: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)