package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.dto.auth.*
import dev.ryuzu.astermanagement.service.AuthenticationService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.util.*

/**
 * Authentication REST Controller
 * 
 * Provides endpoints for user authentication, token refresh, and session management.
 * All endpoints return RFC 7807 Problem+JSON format for errors.
 */
@RestController
@RequestMapping("/api/auth")
@Validated
@Tag(name = "Authentication", description = "User authentication and session management endpoints")
class AuthenticationController(
    private val authenticationService: AuthenticationService
) : BaseController() {

    /**
     * User login endpoint
     */
    @PostMapping(
        "/login",
        consumes = [MediaType.APPLICATION_JSON_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @Operation(
        summary = "User login",
        description = "Authenticates user with email and password, returns JWT tokens"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "Authentication successful",
            content = [Content(schema = Schema(implementation = AuthenticationResponse::class))]
        ),
        ApiResponse(
            responseCode = "428",
            description = "Two-factor authentication required",
            content = [Content(schema = Schema(implementation = TwoFactorRequiredResponse::class))]
        ),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Invalid credentials"),
        ApiResponse(responseCode = "429", description = "Too many authentication attempts")
    )
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<Any> {
        return try {
            when (val response = authenticationService.authenticate(request)) {
                is AuthenticationResponse -> ok(response)
                is TwoFactorRequiredResponse -> ResponseEntity.status(428).body(response)
                else -> throw IllegalStateException("Unexpected response type")
            }
        } catch (e: BadCredentialsException) {
            throw dev.ryuzu.astermanagement.service.exception.UnauthorizedException("Invalid credentials")
        }
    }

    /**
     * Token refresh endpoint
     */
    @PostMapping(
        "/refresh",
        consumes = [MediaType.APPLICATION_JSON_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @Operation(
        summary = "Refresh access token",
        description = "Refreshes expired access token using valid refresh token"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "Token refreshed successfully",
            content = [Content(schema = Schema(implementation = AuthenticationResponse::class))]
        ),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    )
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<AuthenticationResponse> {
        return try {
            val response = authenticationService.refresh(request.refreshToken)
            ok(response)
        } catch (e: BadCredentialsException) {
            throw dev.ryuzu.astermanagement.service.exception.UnauthorizedException("Invalid or expired refresh token")
        }
    }

    /**
     * User logout endpoint
     */
    @PostMapping("/logout")
    @Operation(
        summary = "User logout",
        description = "Logs out user and invalidates tokens. Optionally revokes all user sessions."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Logout successful"),
        ApiResponse(responseCode = "401", description = "User not authenticated")
    )
    fun logout(
        @RequestBody(required = false) request: LogoutRequest?,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<Map<String, String>> {
        val userId = UUID.fromString(user.username)
        
        val success = if (request?.revokeAllSessions == true) {
            authenticationService.revokeAllSessions(userId)
        } else {
            authenticationService.logout(userId)
        }
        
        return if (success) {
            ok(mapOf("message" to "Logout successful"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("error" to "Logout failed"))
        }
    }

    /**
     * Get current user session info
     */
    @GetMapping("/session")
    @Operation(
        summary = "Get session info",
        description = "Returns current user session information"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Session information retrieved"),
        ApiResponse(responseCode = "401", description = "User not authenticated")
    )
    fun getSession(@AuthenticationPrincipal user: UserDetails): ResponseEntity<Map<String, Any>> {
        val userId = UUID.fromString(user.username)
        val isActive = authenticationService.isSessionActive(userId)
        val activeSessions = authenticationService.getActiveSessions(userId)
        
        return ok(mapOf(
            "userId" to userId,
            "username" to user.username,
            "authorities" to user.authorities.map { it.authority },
            "isActive" to isActive,
            "sessionCount" to activeSessions.size,
            "activeSessions" to activeSessions
        ))
    }

    /**
     * Get user profile endpoint
     */
    @GetMapping("/profile")
    @Operation(
        summary = "Get user profile",
        description = "Returns authenticated user information with roles and permissions"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "User profile retrieved successfully",
            content = [Content(schema = Schema(implementation = UserProfileResponse::class))]
        ),
        ApiResponse(responseCode = "401", description = "User not authenticated")
    )
    fun getProfile(@AuthenticationPrincipal user: UserDetails): ResponseEntity<UserProfileResponse> {
        val userEntity = authenticationService.getUserInfo(UUID.fromString(user.username))
        return ok(UserProfileResponse(
            id = userEntity.id!!,
            email = userEntity.email,
            firstName = userEntity.firstName,
            lastName = userEntity.lastName,
            role = userEntity.role.name,
            permissions = user.authorities.map { it.authority }.filter { !it.startsWith("ROLE_") },
            lastLoginAt = userEntity.lastLoginAt
        ))
    }

    /**
     * Revoke all user sessions
     */
    @PostMapping("/revoke-sessions")
    @Operation(
        summary = "Revoke all sessions",
        description = "Revokes all active sessions for the current user"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "All sessions revoked"),
        ApiResponse(responseCode = "401", description = "User not authenticated")
    )
    fun revokeSessions(@AuthenticationPrincipal user: UserDetails): ResponseEntity<Map<String, String>> {
        val userId = UUID.fromString(user.username)
        val success = authenticationService.revokeAllSessions(userId)
        
        return if (success) {
            ok(mapOf("message" to "All sessions revoked successfully"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("error" to "Failed to revoke sessions"))
        }
    }

    /**
     * Health check for authentication service
     */
    @GetMapping("/health")
    @Operation(
        summary = "Authentication service health",
        description = "Returns health status of authentication service"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Service is healthy")
    )
    fun health(): ResponseEntity<Map<String, String>> {
        return ok(mapOf(
            "status" to "UP",
            "service" to "AuthenticationService",
            "timestamp" to System.currentTimeMillis().toString()
        ))
    }
}