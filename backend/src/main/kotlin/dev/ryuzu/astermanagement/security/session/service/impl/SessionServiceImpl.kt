package dev.ryuzu.astermanagement.security.session.service.impl

import dev.ryuzu.astermanagement.config.SessionProperties
import dev.ryuzu.astermanagement.security.session.exception.SessionNotFoundException
import dev.ryuzu.astermanagement.security.session.exception.SessionSecurityException
import dev.ryuzu.astermanagement.security.session.model.*
import dev.ryuzu.astermanagement.security.session.repository.EnhancedSessionRepository
import dev.ryuzu.astermanagement.security.session.service.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.*

/**
 * Implementation of session service providing comprehensive session management.
 */
@Service
class SessionServiceImpl(
    private val sessionRepository: EnhancedSessionRepository,
    private val sessionProperties: SessionProperties
) : SessionService {
    
    companion object {
        private val logger = LoggerFactory.getLogger(SessionServiceImpl::class.java)
    }
    
    override fun createSession(userId: String, request: SessionCreationRequest): Session {
        logger.info("Creating session for user: {} from IP: {}", userId, request.ipAddress)
        
        val metadata = SessionMetadata(
            ipAddress = request.ipAddress,
            userAgent = request.userAgent,
            deviceId = request.deviceId,
            deviceFingerprint = generateDeviceFingerprint(request),
            location = request.location,
            loginMethod = request.loginMethod,
            twoFactorVerified = request.twoFactorVerified,
            rememberMe = request.rememberMe
        )
        
        val session = sessionRepository.createSession(userId, metadata)
        
        // Apply initial attributes if provided
        if (request.initialAttributes.isNotEmpty()) {
            sessionRepository.updateSession(
                session.id,
                SessionUpdate(attributes = request.initialAttributes)
            )
        }
        
        logger.info("Session created successfully: {} for user: {}", session.id, userId)
        return session
    }
    
    override fun validateSession(sessionId: String): Session? {
        logger.trace("Validating session: {}", sessionId)
        
        return try {
            val session = sessionRepository.getSession(sessionId)
            
            session?.let { sessionData ->
                // Perform security checks
                val securityAnalysis = analyzeSessionSecurity(sessionId)
                
                if (securityAnalysis.shouldInvalidate) {
                    logger.warn("Session {} flagged for invalidation due to security concerns: {}", 
                        sessionId, securityAnalysis.riskFactors)
                    sessionRepository.invalidateSession(sessionId)
                    return null
                }
                
                // Update risk score if changed
                if (securityAnalysis.riskScore != sessionData.riskScore) {
                    sessionRepository.updateSession(
                        sessionId,
                        SessionUpdate(attributes = mapOf("riskScore" to securityAnalysis.riskScore))
                    )
                }
                
                sessionData
            }
        } catch (exception: Exception) {
            logger.error("Failed to validate session: {}", sessionId, exception)
            null
        }
    }
    
    override fun refreshSession(sessionId: String): Session? {
        logger.debug("Refreshing session: {}", sessionId)
        
        val session = sessionRepository.getSession(sessionId) ?: return null
        
        return if (sessionRepository.extendSession(sessionId, sessionProperties.timeout.toMinutes())) {
            sessionRepository.getSession(sessionId)
        } else {
            null
        }
    }
    
    override fun updateSession(sessionId: String, request: SessionUpdateRequest): Session {
        logger.debug("Updating session: {}", sessionId)
        
        val updates = SessionUpdate(
            attributes = request.attributes,
            roles = request.roles,
            permissions = request.permissions,
            extendExpiration = request.extendExpiration
        )
        
        return sessionRepository.updateSession(sessionId, updates)
    }
    
    override fun invalidateSession(sessionId: String, reason: String): Boolean {
        logger.info("Invalidating session: {} - reason: {}", sessionId, reason)
        
        return sessionRepository.invalidateSession(sessionId)
    }
    
    override fun invalidateAllUserSessions(userId: String, reason: String): Int {
        logger.info("Invalidating all sessions for user: {} - reason: {}", userId, reason)
        
        return sessionRepository.invalidateUserSessions(userId)
    }
    
    override fun invalidateOtherUserSessions(userId: String, currentSessionId: String, reason: String): Int {
        logger.info("Invalidating other sessions for user: {} except: {} - reason: {}", 
            userId, currentSessionId, reason)
        
        return sessionRepository.invalidateUserSessionsExcept(userId, currentSessionId)
    }
    
    override fun listUserSessions(userId: String): List<SessionInfo> {
        logger.debug("Listing sessions for user: {}", userId)
        
        val sessions = sessionRepository.listUserSessions(userId)
        
        return sessions.map { session ->
            SessionInfo(
                id = session.id,
                createdAt = session.createdAt,
                lastAccessedAt = session.lastAccessedAt,
                expiresAt = session.expiresAt,
                deviceInfo = anonymizeDeviceInfo(session.metadata),
                location = session.metadata.location,
                loginMethod = session.metadata.loginMethod
            )
        }
    }
    
    override fun getSessionDetails(sessionId: String, userId: String?): SessionDetails? {
        logger.debug("Getting session details: {}", sessionId)
        
        val session = sessionRepository.getSession(sessionId) ?: return null
        
        // Authorization check if userId provided
        if (userId != null && session.userId != userId) {
            throw SessionSecurityException(sessionId, "Session does not belong to user")
        }
        
        val securityAnalysis = analyzeSessionSecurity(sessionId)
        
        return SessionDetails(
            session = session,
            securityScore = securityAnalysis.riskScore,
            flags = securityAnalysis.riskFactors.toSet(),
            recentActivity = generateRecentActivity(session)
        )
    }
    
    override fun analyzeSessionSecurity(sessionId: String): SessionSecurityAnalysis {
        logger.trace("Analyzing session security: {}", sessionId)
        
        val session = sessionRepository.getSession(sessionId)
            ?: return SessionSecurityAnalysis(
                sessionId = sessionId,
                riskScore = 100,
                riskFactors = listOf("Session not found"),
                recommendations = listOf("Session should be considered invalid"),
                shouldInvalidate = true
            )
        
        val riskFactors = mutableListOf<String>()
        val recommendations = mutableListOf<String>()
        var riskScore = 0
        
        // Check session age
        val sessionAgeMinutes = session.getAgeInMinutes()
        if (sessionAgeMinutes > sessionProperties.absoluteTimeout.toMinutes()) {
            riskFactors.add("Session exceeded absolute timeout")
            riskScore += 50
        } else if (sessionAgeMinutes > sessionProperties.timeout.toMinutes() * 2) {
            riskFactors.add("Session age is very high")
            riskScore += 20
        }
        
        // Check idle time
        val idleTimeMinutes = session.getIdleTimeInMinutes()
        if (idleTimeMinutes > sessionProperties.inactivityTimeout.toMinutes()) {
            riskFactors.add("Session has been idle too long")
            riskScore += 30
        }
        
        // Check for multiple sessions from same IP
        val sessionsFromSameIp = sessionRepository.findSessions(
            ipAddress = session.metadata.ipAddress,
            activeOnly = true
        )
        if (sessionsFromSameIp.size > sessionProperties.maxConcurrentSessions) {
            riskFactors.add("Multiple sessions from same IP address")
            riskScore += 15
        }
        
        // Check if 2FA was required but not verified
        if (!session.metadata.twoFactorVerified && session.metadata.loginMethod == LoginMethod.PASSWORD) {
            riskFactors.add("Two-factor authentication not verified")
            riskScore += 25
            recommendations.add("Enable two-factor authentication")
        }
        
        // Check for suspicious IP patterns (simplified)
        if (isIpSuspicious(session.metadata.ipAddress)) {
            riskFactors.add("IP address flagged as suspicious")
            riskScore += 40
            recommendations.add("Consider invalidating session")
        }
        
        // Cap risk score at 100
        riskScore = minOf(riskScore, 100)
        
        // Determine if session should be invalidated
        val shouldInvalidate = riskScore >= 80 || riskFactors.contains("Session exceeded absolute timeout")
        
        if (shouldInvalidate) {
            recommendations.add("Invalidate session immediately")
        } else if (riskScore >= 50) {
            recommendations.add("Monitor session closely")
        }
        
        return SessionSecurityAnalysis(
            sessionId = sessionId,
            riskScore = riskScore,
            riskFactors = riskFactors,
            recommendations = recommendations,
            shouldInvalidate = shouldInvalidate
        )
    }
    
    override fun getUserSessionActivity(userId: String, days: Int): SessionActivity {
        logger.debug("Getting session activity for user: {} over {} days", userId, days)
        
        // This is a simplified implementation
        // In a real system, you might store session history separately
        val currentSessions = sessionRepository.listUserSessions(userId)
        
        val uniqueIps = currentSessions.map { it.metadata.ipAddress }.toSet()
        val uniqueDevices = currentSessions.mapNotNull { it.metadata.deviceId }.toSet()
        val loginMethods = currentSessions.groupBy { it.metadata.loginMethod }
            .mapValues { it.value.size }
        
        val averageSessionDuration = if (currentSessions.isNotEmpty()) {
            currentSessions.map { it.getAgeInMinutes() }.average().toLong()
        } else {
            0L
        }
        
        return SessionActivity(
            userId = userId,
            totalSessions = currentSessions.size,
            averageSessionDuration = averageSessionDuration,
            uniqueIpAddresses = uniqueIps.size,
            uniqueDevices = uniqueDevices.size,
            loginMethods = loginMethods,
            timeframe = "Current active sessions (last $days days)"
        )
    }
    
    override fun getSessionStatistics(): SessionStatistics {
        logger.debug("Getting session statistics")
        
        val stats = sessionRepository.getSessionStatistics()
        
        return SessionStatistics(
            totalSessions = stats["total_sessions"] ?: 0,
            activeSessions = stats["active_sessions"] ?: 0,
            expiredSessions = stats["expired_sessions"] ?: 0,
            averageSessionDuration = 0, // Would need session history to calculate
            sessionsPerUser = emptyMap(), // Would need to query all users
            sessionsByLoginMethod = LoginMethod.values().associateWith { method ->
                stats["sessions_${method.name.lowercase()}"] ?: 0
            },
            suspiciousSessions = 0 // Would need to analyze all sessions
        )
    }
    
    override fun performSessionMaintenance(): Int {
        logger.info("Performing session maintenance")
        
        return sessionRepository.cleanupExpiredSessions()
    }
    
    /**
     * Generate a device fingerprint based on request metadata.
     */
    private fun generateDeviceFingerprint(request: SessionCreationRequest): String {
        val components = listOf(
            request.userAgent,
            request.deviceId ?: "unknown",
            request.ipAddress
        )
        
        return components.joinToString("|").hashCode().toString()
    }
    
    /**
     * Anonymize device information for public display.
     */
    private fun anonymizeDeviceInfo(metadata: SessionMetadata): String {
        val userAgent = metadata.userAgent
        
        return when {
            userAgent.contains("Chrome", ignoreCase = true) -> "Chrome Browser"
            userAgent.contains("Firefox", ignoreCase = true) -> "Firefox Browser"
            userAgent.contains("Safari", ignoreCase = true) -> "Safari Browser"
            userAgent.contains("Edge", ignoreCase = true) -> "Edge Browser"
            userAgent.contains("Mobile", ignoreCase = true) -> "Mobile Device"
            else -> "Unknown Device"
        }
    }
    
    /**
     * Generate recent activity summary for a session.
     */
    private fun generateRecentActivity(session: Session): List<String> {
        val activity = mutableListOf<String>()
        
        activity.add("Session created at ${session.createdAt}")
        activity.add("Last accessed at ${session.lastAccessedAt}")
        
        if (session.metadata.twoFactorVerified) {
            activity.add("Two-factor authentication verified")
        }
        
        if (session.attributes.isNotEmpty()) {
            activity.add("Session attributes updated")
        }
        
        return activity
    }
    
    /**
     * Check if an IP address is suspicious (simplified implementation).
     */
    private fun isIpSuspicious(ipAddress: String): Boolean {
        // In a real implementation, this would check against:
        // - Known malicious IP lists
        // - Geolocation anomalies
        // - Rate limiting violations
        // - Historical patterns
        
        return false // Simplified for now
    }
}