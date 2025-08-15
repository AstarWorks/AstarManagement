package com.astarworks.astarmanagement.modules.auth.application.dto

import com.astarworks.astarmanagement.modules.shared.domain.entity.UserRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:Email(message = "Invalid email format")
    @field:NotBlank(message = "Email is required")
    val email: String,
    
    @field:NotBlank(message = "Username is required")
    @field:Size(min = 3, max = 255, message = "Username must be between 3 and 255 characters")
    val username: String,
    
    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val password: String,
    
    @field:NotBlank(message = "First name is required")
    val firstName: String,
    
    @field:NotBlank(message = "Last name is required")
    val lastName: String,
    
    val tenantId: String? = null, // Optional - will use default tenant if not provided
    
    val role: UserRole = UserRole.USER
)