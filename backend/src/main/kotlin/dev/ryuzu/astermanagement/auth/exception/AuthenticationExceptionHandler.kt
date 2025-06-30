package dev.ryuzu.astermanagement.auth.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.authentication.*
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.net.URI
import java.time.Instant

/**
 * Global exception handler for authentication-related exceptions
 * 
 * Provides consistent error responses using RFC 7807 ProblemDetail format
 * for all authentication failures while ensuring security by not leaking
 * sensitive information to potential attackers.
 */
@RestControllerAdvice
class AuthenticationExceptionHandler {

    /**
     * Handle general authentication exceptions
     */
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(ex: AuthenticationException): ProblemDetail {
        val problemDetail = when (ex) {
            is BadCredentialsException -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Invalid credentials",
                "The provided credentials are invalid",
                "invalid_credentials"
            )
            is UsernameNotFoundException -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed",
                "Authentication failed with provided credentials",
                "authentication_failed"
            )
            is AccountExpiredException -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Account expired",
                "The user account has expired",
                "account_expired"
            )
            is LockedException -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Account locked",
                "The user account is locked",
                "account_locked"
            )
            is DisabledException -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Account disabled",
                "The user account is disabled",
                "account_disabled"
            )
            is CredentialsExpiredException -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Credentials expired",
                "The user credentials have expired",
                "credentials_expired"
            )
            else -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed",
                "Authentication failed due to an unknown error",
                "authentication_error"
            )
        }
        
        return problemDetail
    }

    /**
     * Handle token-related exceptions
     */
    @ExceptionHandler(TokenException::class)
    fun handleTokenException(ex: TokenException): ProblemDetail {
        return when (ex.reason) {
            TokenException.Reason.EXPIRED -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Token expired",
                "The authentication token has expired",
                "token_expired"
            )
            TokenException.Reason.INVALID_SIGNATURE -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Invalid token",
                "The authentication token signature is invalid",
                "token_invalid"
            )
            TokenException.Reason.MALFORMED -> createProblemDetail(
                HttpStatus.BAD_REQUEST,
                "Malformed token",
                "The authentication token is malformed",
                "token_malformed"
            )
            TokenException.Reason.BLACKLISTED -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Token revoked",
                "The authentication token has been revoked",
                "token_revoked"
            )
            TokenException.Reason.INVALID -> createProblemDetail(
                HttpStatus.UNAUTHORIZED,
                "Invalid token",
                "The authentication token is invalid",
                "token_invalid"
            )
        }
    }

    /**
     * Handle two-factor authentication exceptions
     */
    @ExceptionHandler(TwoFactorAuthenticationException::class)
    fun handleTwoFactorAuthException(ex: TwoFactorAuthenticationException): ProblemDetail {
        return createProblemDetail(
            HttpStatus.UNAUTHORIZED,
            "Two-factor authentication required",
            ex.message ?: "Two-factor authentication verification failed",
            "two_factor_required"
        )
    }

    /**
     * Creates a standardized ProblemDetail response
     */
    private fun createProblemDetail(
        status: HttpStatus,
        title: String,
        detail: String,
        errorCode: String
    ): ProblemDetail {
        val problemDetail = ProblemDetail.forStatusAndDetail(status, detail)
        problemDetail.title = title
        problemDetail.type = URI.create("https://astermanagement.dev/errors/$errorCode")
        problemDetail.setProperty("errorCode", errorCode)
        problemDetail.setProperty("timestamp", Instant.now())
        return problemDetail
    }
}