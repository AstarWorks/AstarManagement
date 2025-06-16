package dev.ryuzu.astermanagement.dto.auth

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.*

/**
 * Login request DTO
 */
@Schema(description = "Login request with email and password")
data class LoginRequest(
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    @Schema(description = "User email address", example = "lawyer@example.com")
    val email: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    @Schema(description = "User password", example = "password123")
    val password: String
)

/**
 * Refresh token request DTO
 */
@Schema(description = "Refresh token request")
data class RefreshTokenRequest(
    @field:NotBlank(message = "Refresh token is required")
    @Schema(description = "JWT refresh token")
    val refreshToken: String
)

/**
 * Authentication response DTO
 */
@Schema(description = "Authentication response with tokens and user info")
data class AuthenticationResponse(
    @Schema(description = "JWT access token")
    val accessToken: String,

    @Schema(description = "JWT refresh token")
    val refreshToken: String,

    @Schema(description = "Token type", example = "Bearer")
    val tokenType: String,

    @Schema(description = "Token expiration time in seconds", example = "3600")
    val expiresIn: Long,

    @Schema(description = "User information")
    val user: UserInfoResponse
)

/**
 * User information response DTO
 */
@Schema(description = "User information")
data class UserInfoResponse(
    @Schema(description = "User ID")
    val id: UUID,

    @Schema(description = "User email address")
    val email: String,

    @Schema(description = "User full name")
    val name: String,

    @Schema(description = "User role", allowableValues = ["LAWYER", "CLERK", "CLIENT"])
    val role: String,

    @Schema(description = "User permissions")
    val permissions: List<String>
)

/**
 * Logout request DTO
 */
@Schema(description = "Logout request")
data class LogoutRequest(
    @Schema(description = "Optional: Revoke all sessions for the user", example = "false")
    val revokeAllSessions: Boolean = false
)