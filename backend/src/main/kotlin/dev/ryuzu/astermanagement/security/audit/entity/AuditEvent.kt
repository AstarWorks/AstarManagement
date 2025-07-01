package dev.ryuzu.astermanagement.security.audit.entity

import dev.ryuzu.astermanagement.security.audit.RiskLevel
import dev.ryuzu.astermanagement.security.audit.SecurityEventType
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.*

/**
 * Entity for storing comprehensive audit events
 * Immutable by design - no updates allowed for legal compliance
 */
@Entity
@Table(
    name = "audit_events",
    indexes = [
        Index(name = "idx_audit_event_type", columnList = "eventType"),
        Index(name = "idx_audit_timestamp", columnList = "timestamp"),
        Index(name = "idx_audit_user_id", columnList = "userId"),
        Index(name = "idx_audit_ip_address", columnList = "ipAddress"),
        Index(name = "idx_audit_risk_level", columnList = "riskLevel"),
        Index(name = "idx_audit_resource", columnList = "resourceType,resourceId"),
        Index(name = "idx_audit_session", columnList = "sessionId")
    ]
)
class AuditEvent(
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val eventType: SecurityEventType,
    
    @Column(nullable = false)
    val timestamp: Instant = Instant.now(),
    
    @Column(length = 50)
    val userId: String? = null,
    
    @Column(length = 100)
    val username: String? = null,
    
    @Column(length = 50)
    val sessionId: String? = null,
    
    @Column(nullable = false, length = 45) // IPv6 max length
    val ipAddress: String,
    
    @Column(length = 1000)
    val userAgent: String? = null,
    
    @Column(length = 100)
    val resourceType: String? = null,
    
    @Column(length = 100)
    val resourceId: String? = null,
    
    @Column(length = 50)
    val action: String? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val riskLevel: RiskLevel,
    
    @Column(nullable = false)
    val riskScore: Int,
    
    @Column(length = 1000)
    val message: String? = null,
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    val details: Map<String, Any> = emptyMap(),
    
    @Column(length = 500)
    val outcome: String? = null,
    
    @Column(length = 100)
    val correlationId: String? = null,
    
    // Legal compliance fields
    @Column(nullable = false, length = 10)
    val legalJurisdiction: String = "JP", // Japan
    
    @Column(nullable = false)
    val retentionUntil: Instant,
    
    @Column(nullable = false)
    val immutable: Boolean = true

) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID()
    
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
    
    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now()
    
    init {
        // Validate required fields
        require(ipAddress.isNotBlank()) { "IP address is required" }
        require(riskScore in 0..100) { "Risk score must be between 0 and 100" }
    }
    
    companion object {
        /**
         * Create authentication success event
         */
        fun authenticationSuccess(
            userId: String,
            username: String,
            ipAddress: String,
            sessionId: String,
            userAgent: String? = null,
            details: Map<String, Any> = emptyMap()
        ): AuditEvent {
            return AuditEvent(
                eventType = SecurityEventType.AUTHENTICATION_SUCCESS,
                userId = userId,
                username = username,
                ipAddress = ipAddress,
                sessionId = sessionId,
                userAgent = userAgent,
                riskLevel = RiskLevel.LOW,
                riskScore = 10,
                message = "User successfully authenticated",
                details = details + mapOf(
                    "authenticationMethod" to "password",
                    "success" to true
                ),
                outcome = "SUCCESS",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )
        }
        
        /**
         * Create authentication failure event
         */
        fun authenticationFailure(
            username: String,
            ipAddress: String,
            userAgent: String? = null,
            reason: String? = null,
            details: Map<String, Any> = emptyMap()
        ): AuditEvent {
            return AuditEvent(
                eventType = SecurityEventType.AUTHENTICATION_FAILURE,
                username = username,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = RiskLevel.MEDIUM,
                riskScore = 40,
                message = "Authentication failed${reason?.let { ": $it" } ?: ""}",
                details = details + mapOf(
                    "authenticationMethod" to "password",
                    "success" to false,
                    "reason" to (reason ?: "Invalid credentials")
                ),
                outcome = "FAILURE",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )
        }
        
        /**
         * Create suspicious activity event
         */
        fun suspiciousActivity(
            ipAddress: String,
            userAgent: String? = null,
            activityType: String,
            riskScore: Int,
            details: Map<String, Any> = emptyMap()
        ): AuditEvent {
            return AuditEvent(
                eventType = SecurityEventType.SUSPICIOUS_ACTIVITY,
                ipAddress = ipAddress,
                userAgent = userAgent,
                riskLevel = riskScore.toRiskLevel(),
                riskScore = riskScore,
                message = "Suspicious activity detected: $activityType",
                details = details + mapOf(
                    "activityType" to activityType,
                    "automated" to true
                ),
                outcome = "DETECTED",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )
        }
        
        /**
         * Create data access event
         */
        fun dataAccess(
            userId: String,
            username: String,
            resourceType: String,
            resourceId: String,
            action: String,
            ipAddress: String,
            sessionId: String? = null,
            userAgent: String? = null,
            details: Map<String, Any> = emptyMap()
        ): AuditEvent {
            return AuditEvent(
                eventType = SecurityEventType.DATA_ACCESS,
                userId = userId,
                username = username,
                resourceType = resourceType,
                resourceId = resourceId,
                action = action,
                ipAddress = ipAddress,
                sessionId = sessionId,
                userAgent = userAgent,
                riskLevel = if (action == "READ") RiskLevel.LOW else RiskLevel.MEDIUM,
                riskScore = if (action == "read") 15 else 35,
                message = "User $action $resourceType resource",
                details = details + mapOf(
                    "resource" to mapOf(
                        "type" to resourceType,
                        "id" to resourceId
                    ),
                    "action" to action
                ),
                outcome = "SUCCESS",
                retentionUntil = Instant.now().plusSeconds(365 * 24 * 60 * 60 * 10L)
            )
        }
        
        /**
         * Convert risk score to risk level
         */
        private fun Int.toRiskLevel(): RiskLevel = when {
            this <= 30 -> RiskLevel.LOW
            this <= 70 -> RiskLevel.MEDIUM
            this <= 90 -> RiskLevel.HIGH
            else -> RiskLevel.CRITICAL
        }
    }
}

/**
 * Extension functions for creating audit events
 */
fun SecurityEventType.toRiskLevel(): RiskLevel = when (this) {
    SecurityEventType.AUTHENTICATION_SUCCESS,
    SecurityEventType.SESSION_CREATED,
    SecurityEventType.DATA_ACCESS -> RiskLevel.LOW
    
    SecurityEventType.AUTHENTICATION_FAILURE,
    SecurityEventType.PASSWORD_CHANGE,
    SecurityEventType.SESSION_TERMINATED,
    SecurityEventType.TWO_FACTOR_VERIFICATION -> RiskLevel.MEDIUM
    
    SecurityEventType.ACCOUNT_LOCKOUT,
    SecurityEventType.PRIVILEGE_ESCALATION,
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecurityEventType.CONFIGURATION_CHANGE -> RiskLevel.HIGH
    
    SecurityEventType.SUSPICIOUS_ACTIVITY,
    SecurityEventType.AUTHORIZATION_FAILURE,
    SecurityEventType.SECURITY_ERROR -> RiskLevel.CRITICAL
    
    else -> RiskLevel.MEDIUM
}