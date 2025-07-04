package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.modules.audit.api.AuditEventType
import dev.ryuzu.astermanagement.modules.audit.api.DocumentAccessType
import dev.ryuzu.astermanagement.service.AuditEventPublisher
import dev.ryuzu.astermanagement.service.base.BaseService
import org.aspectj.lang.JoinPoint
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.*

/**
 * Aspect for automatic audit capture of service layer operations
 * Provides transparent audit logging without modifying business logic
 */
@Aspect
@Component
class AuditAspect(
    private val auditEventPublisher: AuditEventPublisher
) : BaseService() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Pointcut for all public methods in service packages
     */
    @Pointcut("execution(public * dev.ryuzu.astermanagement.service..*(..))")
    fun serviceLayerExecution() {}
    
    /**
     * Pointcut for methods annotated with @AuditLog
     */
    @Pointcut("@annotation(auditLog)")
    fun auditLogAnnotated(auditLog: AuditLog) {}
    
    /**
     * Pointcut for methods annotated with @AuditMatterOperation
     */
    @Pointcut("@annotation(auditMatterOperation)")
    fun auditMatterOperationAnnotated(auditMatterOperation: AuditMatterOperation) {}
    
    /**
     * Pointcut for methods annotated with @AuditDocumentAccess
     */
    @Pointcut("@annotation(auditDocumentAccess)")
    fun auditDocumentAccessAnnotated(auditDocumentAccess: AuditDocumentAccess) {}
    
    /**
     * Around advice for matter operations with automatic audit capture
     */
    @Around("auditMatterOperationAnnotated(auditMatterOperation)")
    fun auditMatterOperation(joinPoint: ProceedingJoinPoint, auditMatterOperation: AuditMatterOperation): Any? {
        val startTime = System.currentTimeMillis()
        val correlationId = UUID.randomUUID().toString()
        val userId = getCurrentUserId()?.toString() ?: "system"
        
        logger.debug("Starting matter operation: {} with correlation ID: {}", 
            auditMatterOperation.operation, correlationId)
        
        return try {
            val result = joinPoint.proceed()
            val duration = System.currentTimeMillis() - startTime
            
            // Publish success audit event
            publishMatterOperationSuccess(
                operation = auditMatterOperation.operation,
                joinPoint = joinPoint,
                result = result,
                duration = duration,
                userId = userId,
                correlationId = correlationId
            )
            
            result
        } catch (e: Exception) {
            val duration = System.currentTimeMillis() - startTime
            
            // Publish failure audit event
            publishMatterOperationFailure(
                operation = auditMatterOperation.operation,
                joinPoint = joinPoint,
                exception = e,
                duration = duration,
                userId = userId,
                correlationId = correlationId
            )
            
            throw e
        }
    }
    
    /**
     * Around advice for document access operations
     */
    @Around("auditDocumentAccessAnnotated(auditDocumentAccess)")
    fun auditDocumentAccess(joinPoint: ProceedingJoinPoint, auditDocumentAccess: AuditDocumentAccess): Any? {
        val userId = getCurrentUserId()?.toString() ?: "system"
        
        return try {
            val result = joinPoint.proceed()
            
            // Extract document information from method parameters or result
            val documentInfo = extractDocumentInfo(joinPoint, result)
            
            if (documentInfo != null) {
                auditEventPublisher.publishDocumentAccessed(
                    documentId = documentInfo.documentId,
                    matterId = documentInfo.matterId,
                    documentName = documentInfo.documentName,
                    accessType = auditDocumentAccess.accessType,
                    userId = userId
                )
            }
            
            result
        } catch (e: Exception) {
            logger.warn("Document access audit failed for operation: ${auditDocumentAccess.accessType}", e)
            throw e
        }
    }
    
    /**
     * After advice for generic audit logging
     */
    @After("auditLogAnnotated(auditLog)")
    fun auditGenericOperation(joinPoint: JoinPoint, auditLog: AuditLog) {
        try {
            val userId = getCurrentUserId()?.toString() ?: "system"
            val methodName = joinPoint.signature.name
            val className = joinPoint.target.javaClass.simpleName
            
            auditEventPublisher.publishCustomEvent(
                eventType = auditLog.eventType,
                entityType = auditLog.entityType.ifEmpty { className },
                entityId = extractEntityId(joinPoint) ?: "unknown",
                details = mapOf(
                    "method" to methodName,
                    "class" to className,
                    "operation" to auditLog.operation.ifEmpty { methodName },
                    "parameters" to extractParameterInfo(joinPoint)
                ),
                userId = userId
            )
            
        } catch (e: Exception) {
            logger.warn("Generic audit logging failed for method: ${joinPoint.signature.name}", e)
        }
    }
    
    /**
     * Around advice for performance monitoring of audited operations
     */
    @Around("serviceLayerExecution() && (auditLogAnnotated(*) || auditMatterOperationAnnotated(*) || auditDocumentAccessAnnotated(*))")
    fun monitorAuditedOperation(joinPoint: ProceedingJoinPoint): Any? {
        val startTime = System.currentTimeMillis()
        val methodName = "${joinPoint.target.javaClass.simpleName}.${joinPoint.signature.name}"
        
        return try {
            val result = joinPoint.proceed()
            val duration = System.currentTimeMillis() - startTime
            
            if (duration > 1000) {
                logger.warn("Slow audited operation detected: {} took {}ms", methodName, duration)
            }
            
            result
        } catch (e: Exception) {
            val duration = System.currentTimeMillis() - startTime
            logger.error("Audited operation failed: {} after {}ms", methodName, duration, e)
            throw e
        }
    }
    
    /**
     * Publishes successful matter operation audit event
     */
    private fun publishMatterOperationSuccess(
        operation: String,
        joinPoint: ProceedingJoinPoint,
        result: Any?,
        duration: Long,
        userId: String,
        correlationId: String
    ) {
        try {
            val matterId = extractMatterId(joinPoint, result)
            val operationDetails = extractOperationDetails(joinPoint, result)
            
            if (matterId != null) {
                val eventType = mapOperationToEventType(operation)
                
                when (eventType) {
                    AuditEventType.MATTER_CREATED -> {
                        if (result != null) {
                            val matterInfo = extractMatterInfo(result)
                            auditEventPublisher.publishMatterCreated(
                                matterId = matterId,
                                matterTitle = matterInfo.title,
                                clientName = matterInfo.clientName,
                                assignedLawyer = matterInfo.assignedLawyer,
                                userId = userId
                            )
                        }
                    }
                    AuditEventType.MATTER_STATUS_CHANGED -> {
                        val statusInfo = extractStatusChangeInfo(joinPoint, result)
                        auditEventPublisher.publishMatterStatusChanged(
                            matterId = matterId,
                            oldStatus = statusInfo.oldStatus,
                            newStatus = statusInfo.newStatus,
                            reason = statusInfo.reason,
                            userId = userId
                        )
                    }
                    else -> {
                        auditEventPublisher.publishCustomEvent(
                            eventType = eventType,
                            entityType = "Matter",
                            entityId = matterId.toString(),
                            details = operationDetails + mapOf(
                                "operation" to operation,
                                "duration" to duration,
                                "correlationId" to correlationId,
                                "success" to true
                            ),
                            correlationId = correlationId,
                            userId = userId
                        )
                    }
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to publish matter operation success audit event", e)
        }
    }
    
    /**
     * Publishes failed matter operation audit event
     */
    private fun publishMatterOperationFailure(
        operation: String,
        joinPoint: ProceedingJoinPoint,
        exception: Exception,
        duration: Long,
        userId: String,
        correlationId: String
    ) {
        try {
            val matterId = extractMatterId(joinPoint, null)
            
            auditEventPublisher.publishCustomEvent(
                eventType = AuditEventType.SYSTEM_EVENT,
                entityType = "Matter",
                entityId = matterId?.toString() ?: "unknown",
                details = mapOf(
                    "operation" to operation,
                    "duration" to duration,
                    "correlationId" to correlationId,
                    "success" to false,
                    "errorType" to exception.javaClass.simpleName,
                    "errorMessage" to (exception.message ?: "Unknown error"),
                    "method" to joinPoint.signature.name
                ),
                correlationId = correlationId,
                userId = userId
            )
        } catch (e: Exception) {
            logger.error("Failed to publish matter operation failure audit event", e)
        }
    }
    
    /**
     * Helper methods for extracting information from join points
     */
    private fun extractMatterId(joinPoint: ProceedingJoinPoint, result: Any?): UUID? {
        return try {
            // Try to extract from method parameters first
            joinPoint.args.find { it is UUID }?.let { return it as UUID }
            
            // Try to extract from result if it has an ID field
            result?.let { 
                val idField = it.javaClass.getDeclaredField("id")
                idField.isAccessible = true
                idField.get(it) as? UUID
            }
        } catch (e: Exception) {
            logger.debug("Could not extract matter ID from join point", e)
            null
        }
    }
    
    private fun extractEntityId(joinPoint: JoinPoint): String? {
        return try {
            joinPoint.args.find { it is UUID }?.toString()
                ?: joinPoint.args.find { it is String }?.toString()
        } catch (e: Exception) {
            null
        }
    }
    
    private fun extractParameterInfo(joinPoint: JoinPoint): Map<String, Any> {
        return try {
            joinPoint.args.mapIndexed { index, arg ->
                "param$index" to (arg?.toString() ?: "null")
            }.toMap()
        } catch (e: Exception) {
            emptyMap()
        }
    }
    
    private fun extractDocumentInfo(joinPoint: ProceedingJoinPoint, result: Any?): DocumentInfo? {
        return try {
            // Implementation would depend on your document structure
            // This is a placeholder that would need to be adapted to your actual document model
            null
        } catch (e: Exception) {
            null
        }
    }
    
    private fun extractMatterInfo(result: Any): MatterInfo {
        return try {
            // Use reflection to extract matter information
            val titleField = result.javaClass.getDeclaredField("title")
            val clientField = result.javaClass.getDeclaredField("clientName")
            
            titleField.isAccessible = true
            clientField.isAccessible = true
            
            MatterInfo(
                title = titleField.get(result) as? String ?: "Unknown",
                clientName = clientField.get(result) as? String ?: "Unknown",
                assignedLawyer = null // Would extract if available
            )
        } catch (e: Exception) {
            MatterInfo("Unknown", "Unknown", null)
        }
    }
    
    private fun extractStatusChangeInfo(joinPoint: ProceedingJoinPoint, result: Any?): StatusChangeInfo {
        return try {
            // Extract status change information from parameters or result
            StatusChangeInfo("Unknown", "Unknown", null)
        } catch (e: Exception) {
            StatusChangeInfo("Unknown", "Unknown", null)
        }
    }
    
    private fun extractOperationDetails(joinPoint: ProceedingJoinPoint, result: Any?): Map<String, Any> {
        return mapOf(
            "method" to joinPoint.signature.name,
            "class" to joinPoint.target.javaClass.simpleName,
            "parametersCount" to joinPoint.args.size,
            "hasResult" to (result != null)
        )
    }
    
    private fun mapOperationToEventType(operation: String): AuditEventType {
        return when (operation.lowercase()) {
            "create", "createMatter" -> AuditEventType.MATTER_CREATED
            "update", "updateMatter" -> AuditEventType.MATTER_UPDATED
            "delete", "deleteMatter" -> AuditEventType.MATTER_DELETED
            "changeStatus", "updateStatus" -> AuditEventType.MATTER_STATUS_CHANGED
            else -> AuditEventType.SYSTEM_EVENT
        }
    }
}

/**
 * Data classes for extracted information
 */
data class DocumentInfo(
    val documentId: UUID,
    val matterId: UUID,
    val documentName: String
)

data class MatterInfo(
    val title: String,
    val clientName: String,
    val assignedLawyer: String?
)

data class StatusChangeInfo(
    val oldStatus: String,
    val newStatus: String,
    val reason: String?
)

/**
 * Audit annotations for method-level audit configuration
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditLog(
    val eventType: AuditEventType = AuditEventType.SYSTEM_EVENT,
    val entityType: String = "",
    val operation: String = ""
)

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditMatterOperation(
    val operation: String
)

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditDocumentAccess(
    val accessType: DocumentAccessType = DocumentAccessType.VIEW
)