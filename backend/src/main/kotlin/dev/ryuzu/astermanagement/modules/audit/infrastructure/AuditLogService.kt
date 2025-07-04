package dev.ryuzu.astermanagement.modules.audit.infrastructure

import dev.ryuzu.astermanagement.modules.audit.domain.AuditLog
import dev.ryuzu.astermanagement.modules.audit.domain.AuditLogRepository
import dev.ryuzu.astermanagement.modules.audit.domain.AuditLogRequest
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Internal service for audit log operations within the audit module
 */
@Service
@Transactional
class AuditLogService(
    private val auditLogRepository: AuditLogRepository
) {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Save an audit log entry
     */
    fun saveAuditLog(request: AuditLogRequest): AuditLog {
        return try {
            val auditLog = request.toAuditLog()
            auditLogRepository.save(auditLog).also {
                logger.debug("Saved audit log: ${it.eventType} for ${it.entityType}:${it.entityId}")
            }
        } catch (e: Exception) {
            logger.error("Failed to save audit log: ${request.eventType} for ${request.entityType}:${request.entityId}", e)
            throw e
        }
    }
    
    /**
     * Find audit logs by entity
     */
    @Transactional(readOnly = true)
    fun findAuditTrail(
        entityType: String,
        entityId: String,
        pageable: Pageable
    ): Page<AuditLog> {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByEventTimestampDesc(
            entityType, entityId, pageable
        )
    }
}