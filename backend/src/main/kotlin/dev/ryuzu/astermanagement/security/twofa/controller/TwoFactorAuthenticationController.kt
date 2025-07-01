package dev.ryuzu.astermanagement.security.twofa.controller

import dev.ryuzu.astermanagement.security.auth.annotation.CurrentUser
import dev.ryuzu.astermanagement.security.auth.dto.UserPrincipal
import dev.ryuzu.astermanagement.security.twofa.dto.*
import dev.ryuzu.astermanagement.security.twofa.exception.TwoFactorException
import dev.ryuzu.astermanagement.security.twofa.service.TwoFactorAuthenticationService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.*

/**
 * REST controller for two-factor authentication operations.
 * Provides endpoints for setup, enable/disable, and verification of 2FA.
 */
@RestController
@RequestMapping("/api/auth/2fa")
@Tag(name = "Two-Factor Authentication", description = "Endpoints for managing 2FA")
@SecurityRequirement(name = "bearer-jwt")
class TwoFactorAuthenticationController(
    private val twoFactorService: TwoFactorAuthenticationService
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Setup 2FA for the authenticated user.
     * Generates secret and QR code but does not enable 2FA yet.
     */
    @PostMapping("/setup", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Setup 2FA",
        description = "Generate secret and QR code for 2FA setup"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Setup successful"),
        ApiResponse(responseCode = "400", description = "2FA already enabled"),
        ApiResponse(responseCode = "401", description = "Not authenticated")
    )
    @PreAuthorize("isAuthenticated()")
    fun setupTwoFactor(
        @Parameter(hidden = true) @CurrentUser user: UserPrincipal
    ): ResponseEntity<TwoFactorSetupResponse> {
        logger.info("2FA setup requested by user: ${user.id}")
        
        return try {
            val response = twoFactorService.setupTwoFactor(user.id)
            ResponseEntity.ok(response)
        } catch (e: TwoFactorException.AlreadyEnabled) {
            throw TwoFactorProblemException(
                status = HttpStatus.BAD_REQUEST,
                detail = e.message,
                errorCode = e.errorCode
            )
        }
    }
    
    /**
     * Enable 2FA after verifying the initial code.
     */
    @PostMapping("/enable", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Enable 2FA",
        description = "Enable 2FA after verifying the initial TOTP code"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "2FA enabled successfully"),
        ApiResponse(responseCode = "400", description = "Invalid code or 2FA already enabled"),
        ApiResponse(responseCode = "401", description = "Not authenticated"),
        ApiResponse(responseCode = "404", description = "2FA not set up")
    )
    @PreAuthorize("isAuthenticated()")
    fun enableTwoFactor(
        @Parameter(hidden = true) @CurrentUser user: UserPrincipal,
        @Valid @RequestBody request: TwoFactorEnableRequest
    ): ResponseEntity<TwoFactorEnableResponse> {
        logger.info("2FA enable requested by user: ${user.id}")
        
        return try {
            val response = twoFactorService.enableTwoFactor(user.id, request.code)
            ResponseEntity.ok(response)
        } catch (e: TwoFactorException) {
            val status = when (e) {
                is TwoFactorException.NotSetup -> HttpStatus.NOT_FOUND
                is TwoFactorException.InvalidCode -> HttpStatus.BAD_REQUEST
                is TwoFactorException.AlreadyEnabled -> HttpStatus.BAD_REQUEST
                else -> HttpStatus.BAD_REQUEST
            }
            throw TwoFactorProblemException(
                status = status,
                detail = e.message,
                errorCode = e.errorCode
            )
        }
    }
    
    /**
     * Disable 2FA (requires password verification).
     */
    @PostMapping("/disable", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Disable 2FA",
        description = "Disable 2FA after password verification"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "2FA disabled successfully"),
        ApiResponse(responseCode = "400", description = "Invalid password"),
        ApiResponse(responseCode = "401", description = "Not authenticated"),
        ApiResponse(responseCode = "404", description = "2FA not enabled")
    )
    @PreAuthorize("isAuthenticated()")
    fun disableTwoFactor(
        @Parameter(hidden = true) @CurrentUser user: UserPrincipal,
        @Valid @RequestBody request: TwoFactorDisableRequest
    ): ResponseEntity<TwoFactorDisableResponse> {
        logger.info("2FA disable requested by user: ${user.id}")
        
        return try {
            val response = twoFactorService.disableTwoFactor(user.id, request.password)
            ResponseEntity.ok(response)
        } catch (e: TwoFactorException) {
            val status = when (e) {
                is TwoFactorException.NotEnabled -> HttpStatus.NOT_FOUND
                is TwoFactorException.InvalidPassword -> HttpStatus.BAD_REQUEST
                else -> HttpStatus.BAD_REQUEST
            }
            throw TwoFactorProblemException(
                status = status,
                detail = e.message,
                errorCode = e.errorCode
            )
        }
    }
    
    /**
     * Verify TOTP code during login (after password verification).
     * This endpoint does not require full authentication, only session token.
     */
    @PostMapping("/verify", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Verify TOTP code",
        description = "Verify TOTP code during login process"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Verification successful"),
        ApiResponse(responseCode = "400", description = "Invalid code"),
        ApiResponse(responseCode = "404", description = "2FA not enabled"),
        ApiResponse(responseCode = "429", description = "Too many attempts")
    )
    fun verifyTOTPCode(
        @Valid @RequestBody request: TwoFactorVerificationRequest
    ): ResponseEntity<TwoFactorVerificationResponse> {
        // Extract user ID from session token
        val userId = extractUserIdFromSessionToken(request.sessionToken)
        
        return try {
            val response = twoFactorService.verifyTOTPCode(userId, request.code)
            // In real implementation, generate JWT tokens here
            ResponseEntity.ok(response)
        } catch (e: TwoFactorException) {
            handleVerificationException(e)
        }
    }
    
    /**
     * Verify backup code during login (alternative to TOTP).
     */
    @PostMapping("/verify-backup", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Verify backup code",
        description = "Verify backup code as alternative to TOTP"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Verification successful"),
        ApiResponse(responseCode = "400", description = "Invalid backup code"),
        ApiResponse(responseCode = "404", description = "2FA not enabled"),
        ApiResponse(responseCode = "429", description = "Too many attempts")
    )
    fun verifyBackupCode(
        @Valid @RequestBody request: BackupCodeVerificationRequest
    ): ResponseEntity<TwoFactorVerificationResponse> {
        // Extract user ID from session token
        val userId = extractUserIdFromSessionToken(request.sessionToken)
        
        return try {
            val response = twoFactorService.verifyBackupCode(userId, request.backupCode)
            // In real implementation, generate JWT tokens here
            ResponseEntity.ok(response)
        } catch (e: TwoFactorException) {
            handleVerificationException(e)
        }
    }
    
    /**
     * Get current 2FA status for the authenticated user.
     */
    @GetMapping("/status", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Get 2FA status",
        description = "Get current 2FA status and configuration"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Status retrieved"),
        ApiResponse(responseCode = "401", description = "Not authenticated")
    )
    @PreAuthorize("isAuthenticated()")
    fun getTwoFactorStatus(
        @Parameter(hidden = true) @CurrentUser user: UserPrincipal
    ): ResponseEntity<TwoFactorStatusResponse> {
        val status = twoFactorService.getTwoFactorStatus(user.id)
        return ResponseEntity.ok(status)
    }
    
    /**
     * Regenerate backup codes (requires password verification).
     */
    @PostMapping("/backup-codes", produces = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(
        summary = "Regenerate backup codes",
        description = "Generate new set of backup codes"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Backup codes regenerated"),
        ApiResponse(responseCode = "400", description = "Invalid password"),
        ApiResponse(responseCode = "401", description = "Not authenticated"),
        ApiResponse(responseCode = "404", description = "2FA not enabled")
    )
    @PreAuthorize("isAuthenticated()")
    fun regenerateBackupCodes(
        @Parameter(hidden = true) @CurrentUser user: UserPrincipal,
        @Valid @RequestBody request: RegenerateBackupCodesRequest
    ): ResponseEntity<BackupCodesResponse> {
        logger.info("Backup codes regeneration requested by user: ${user.id}")
        
        return try {
            val response = twoFactorService.regenerateBackupCodes(user.id, request.password)
            ResponseEntity.ok(response)
        } catch (e: TwoFactorException) {
            val status = when (e) {
                is TwoFactorException.NotEnabled -> HttpStatus.NOT_FOUND
                is TwoFactorException.InvalidPassword -> HttpStatus.BAD_REQUEST
                else -> HttpStatus.BAD_REQUEST
            }
            throw TwoFactorProblemException(
                status = status,
                detail = e.message,
                errorCode = e.errorCode
            )
        }
    }
    
    /**
     * Extract user ID from session token.
     * In real implementation, this would validate and decode the session token.
     */
    private fun extractUserIdFromSessionToken(sessionToken: String): UUID {
        // TODO: Implement proper session token validation
        // For now, assume the token contains the user ID
        return try {
            UUID.fromString(sessionToken.substringBefore(":"))
        } catch (e: Exception) {
            throw TwoFactorException.InvalidSessionToken()
        }
    }
    
    /**
     * Handle verification exceptions and convert to proper HTTP responses.
     */
    private fun handleVerificationException(e: TwoFactorException): Nothing {
        val (status, errorResponse) = when (e) {
            is TwoFactorException.NotEnabled -> 
                HttpStatus.NOT_FOUND to null
            
            is TwoFactorException.InvalidCode -> 
                HttpStatus.BAD_REQUEST to TwoFactorErrorResponse(
                    error = e.errorCode,
                    message = e.message,
                    remainingAttempts = e.remainingAttempts
                )
            
            is TwoFactorException.InvalidBackupCode ->
                HttpStatus.BAD_REQUEST to TwoFactorErrorResponse(
                    error = e.errorCode,
                    message = e.message,
                    remainingAttempts = e.remainingAttempts
                )
            
            is TwoFactorException.TooManyAttempts ->
                HttpStatus.TOO_MANY_REQUESTS to TwoFactorErrorResponse(
                    error = e.errorCode,
                    message = e.message,
                    rateLimitResetIn = e.resetInSeconds
                )
            
            else -> HttpStatus.BAD_REQUEST to null
        }
        
        if (errorResponse != null) {
            throw TwoFactorErrorResponseException(status, errorResponse)
        } else {
            throw TwoFactorProblemException(
                status = status,
                detail = e.message,
                errorCode = e.errorCode
            )
        }
    }
}

/**
 * Exception that returns ProblemDetail for 2FA errors
 */
class TwoFactorProblemException(
    val status: HttpStatus,
    val detail: String,
    val errorCode: String
) : RuntimeException(detail) {
    fun toProblemDetail(): ProblemDetail {
        val problemDetail = ProblemDetail.forStatus(status)
        problemDetail.title = "Two-Factor Authentication Error"
        problemDetail.detail = detail
        problemDetail.properties = mapOf(
            "errorCode" to errorCode,
            "timestamp" to Instant.now().toString()
        )
        return problemDetail
    }
}

/**
 * Exception that returns custom error response for 2FA verification
 */
class TwoFactorErrorResponseException(
    val status: HttpStatus,
    val errorResponse: TwoFactorErrorResponse
) : RuntimeException(errorResponse.message)