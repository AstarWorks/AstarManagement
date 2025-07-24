package dev.ryuzu.astermanagement.security.session.exception

import java.util.UUID

/**
 * Base class for session-related exceptions.
 */
sealed class SessionException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Thrown when a session is not found.
 */
class SessionNotFoundException(
    val sessionId: String
) : SessionException("Session not found: $sessionId")

/**
 * Thrown when a session has expired.
 */
class SessionExpiredException(
    val sessionId: String,
    val expiredAt: java.time.Instant
) : SessionException("Session expired at $expiredAt: $sessionId")

/**
 * Thrown when user reaches concurrent session limit.
 */
class ConcurrentSessionLimitException(
    val userId: String,
    val currentSessionCount: Int,
    val maxAllowedSessions: Int
) : SessionException(
    "User $userId has reached maximum concurrent sessions limit: $currentSessionCount/$maxAllowedSessions"
)

/**
 * Thrown when session data is invalid or corrupted.
 */
class InvalidSessionDataException(
    val sessionId: String,
    val reason: String
) : SessionException("Invalid session data for $sessionId: $reason")

/**
 * Thrown when session operation is not allowed due to security reasons.
 */
class SessionSecurityException(
    val sessionId: String,
    val reason: String
) : SessionException("Session security violation for $sessionId: $reason")

/**
 * Thrown when session store is unavailable.
 */
class SessionStoreException(
    message: String,
    cause: Throwable? = null
) : SessionException("Session store error: $message", cause)

/**
 * Thrown when attempting to access session from different IP address.
 */
class SessionIpMismatchException(
    val sessionId: String,
    val originalIp: String,
    val currentIp: String
) : SessionException("Session IP mismatch for $sessionId: original=$originalIp, current=$currentIp")

/**
 * Thrown when session shows suspicious activity.
 */
class SuspiciousSessionActivityException(
    val sessionId: String,
    val riskScore: Int,
    val reason: String
) : SessionException("Suspicious activity detected for session $sessionId (risk score: $riskScore): $reason")