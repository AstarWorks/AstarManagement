package dev.ryuzu.astermanagement.service.impl

import dev.ryuzu.astermanagement.config.AuditLog
import dev.ryuzu.astermanagement.config.AuditMatterOperation
import dev.ryuzu.astermanagement.domain.audit.AuditEventType
import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.AuditEventPublisher
import dev.ryuzu.astermanagement.service.AuditService
import dev.ryuzu.astermanagement.service.MatterService
import dev.ryuzu.astermanagement.service.StatusTransitionService
import dev.ryuzu.astermanagement.service.StatusTransitionContext
import dev.ryuzu.astermanagement.service.base.BaseService
import dev.ryuzu.astermanagement.service.exception.*
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.Caching
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Implementation of MatterService with comprehensive business logic
 * Uses JPA repositories and backend domain model
 */
@Service
@Transactional(readOnly = true)
class MatterServiceImpl(
    private val matterRepository: MatterRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
    private val auditEventPublisher: AuditEventPublisher,
    private val statusTransitionService: StatusTransitionService
) : BaseService(), MatterService {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    @Transactional
    @AuditMatterOperation(operation = "createMatter")
    @CacheEvict(value = ["matters"], allEntries = true)
    override fun createMatter(matter: Matter): Matter {
        validateCreateMatter(matter)
        
        // Check if case number already exists
        if (existsByCaseNumber(matter.caseNumber)) {
            throw ResourceAlreadyExistsException("Matter", matter.caseNumber)
        }
        
        // Validate assigned lawyer exists if provided
        matter.assignedLawyer?.id?.let { lawyerId ->
            userRepository.findById(lawyerId).orElseThrow {
                ValidationException("assignedLawyer", "Assigned lawyer not found: $lawyerId")
            }
        }
        
        // Set matter to initial status if not provided
        if (matter.status == null) {
            matter.status = MatterStatus.INTAKE
        }
        
        val savedMatter = matterRepository.save(matter)
        
        // Publish comprehensive audit event
        auditEventPublisher.publishMatterCreated(
            matterId = savedMatter.id!!,
            matterTitle = savedMatter.title,
            clientName = savedMatter.clientName,
            assignedLawyer = savedMatter.assignedLawyer?.username
        )
        
        // Keep legacy audit for backward compatibility
        logMatterActivity(savedMatter.id!!, "CREATED", "Matter created with case number: ${savedMatter.caseNumber}")
        
        return savedMatter
    }
    
    @Cacheable(
        value = ["matter-details"],
        key = "#id.toString() + '_' + #root.target.getCurrentUserId()",
        condition = "#id != null"
    )
    override fun getMatterById(id: UUID): Matter? {
        val matter = matterRepository.findById(id).orElse(null) ?: return null
        
        // Apply security filtering
        if (!canUserAccessMatter(matter)) {
            throw InsufficientPermissionException("User cannot access this matter")
        }
        
        return matter
    }
    
    @Cacheable(
        value = ["matters"],
        key = "#pageable.pageNumber + '_' + #pageable.pageSize + '_' + (#status?.name ?: 'null') + '_' + (#clientName ?: 'null') + '_' + #root.target.getCurrentUserId()",
        condition = "#pageable != null"
    )
    override fun getAllMatters(
        pageable: Pageable,
        status: MatterStatus?,
        clientName: String?
    ): Page<Matter> {
        val page = when {
            status != null && clientName != null -> {
                matterRepository.searchMatters(
                    caseNumber = null,
                    clientName = clientName,
                    title = null,
                    status = status,
                    priority = null,
                    assignedLawyer = null,
                    pageable = pageable
                )
            }
            status != null -> matterRepository.findByStatus(status, pageable)
            clientName != null -> {
                val matters = matterRepository.findByClientNameContainingIgnoreCase(clientName)
                // Convert to Page manually for now - in production, implement repository method with Pageable
                org.springframework.data.domain.PageImpl(
                    matters.drop(pageable.offset.toInt()).take(pageable.pageSize),
                    pageable,
                    matters.size.toLong()
                )
            }
            else -> matterRepository.findAll(pageable)
        }
        
        // Apply security filtering to the page content
        val filteredContent = page.content.filter { matter ->
            canUserAccessMatter(matter)
        }
        
        return org.springframework.data.domain.PageImpl(
            filteredContent,
            pageable,
            page.totalElements
        )
    }
    
    @Transactional
    @AuditMatterOperation(operation = "updateMatter")
    @Caching(evict = [
        CacheEvict(value = ["matter-details"], key = "#id.toString() + '_*'", allEntries = false),
        CacheEvict(value = ["matters"], allEntries = true)
    ])
    override fun updateMatter(id: UUID, matter: Matter): Matter? {
        val existingMatter = matterRepository.findById(id).orElse(null) ?: return null
        
        // Check permissions
        if (!canUserModifyMatter(existingMatter)) {
            throw InsufficientPermissionException("User cannot modify this matter")
        }
        
        validateUpdateMatter(matter)
        
        // Track changes for audit
        val fieldsChanged = mutableListOf<String>()
        val oldValues = mutableMapOf<String, Any?>()
        val newValues = mutableMapOf<String, Any?>()
        
        // Update fields while tracking changes
        existingMatter.apply {
            if (title != matter.title) {
                fieldsChanged.add("title")
                oldValues["title"] = title
                newValues["title"] = matter.title
                title = matter.title
            }
            if (description != matter.description) {
                fieldsChanged.add("description")
                oldValues["description"] = description
                newValues["description"] = matter.description
                description = matter.description
            }
            if (clientName != matter.clientName) {
                fieldsChanged.add("clientName")
                oldValues["clientName"] = clientName
                newValues["clientName"] = matter.clientName
                clientName = matter.clientName
            }
            if (clientContact != matter.clientContact) {
                fieldsChanged.add("clientContact")
                oldValues["clientContact"] = clientContact
                newValues["clientContact"] = matter.clientContact
                clientContact = matter.clientContact
            }
            if (opposingParty != matter.opposingParty) {
                fieldsChanged.add("opposingParty")
                oldValues["opposingParty"] = opposingParty
                newValues["opposingParty"] = matter.opposingParty
                opposingParty = matter.opposingParty
            }
            if (courtName != matter.courtName) {
                fieldsChanged.add("courtName")
                oldValues["courtName"] = courtName
                newValues["courtName"] = matter.courtName
                courtName = matter.courtName
            }
            if (filingDate != matter.filingDate) {
                fieldsChanged.add("filingDate")
                oldValues["filingDate"] = filingDate
                newValues["filingDate"] = matter.filingDate
                filingDate = matter.filingDate
            }
            if (estimatedCompletionDate != matter.estimatedCompletionDate) {
                fieldsChanged.add("estimatedCompletionDate")
                oldValues["estimatedCompletionDate"] = estimatedCompletionDate
                newValues["estimatedCompletionDate"] = matter.estimatedCompletionDate
                estimatedCompletionDate = matter.estimatedCompletionDate
            }
            if (notes != matter.notes) {
                fieldsChanged.add("notes")
                oldValues["notes"] = notes
                newValues["notes"] = matter.notes
                notes = matter.notes
            }
            if (tags != matter.tags) {
                fieldsChanged.add("tags")
                oldValues["tags"] = tags
                newValues["tags"] = matter.tags
                tags = matter.tags
            }
        }
        
        val updatedMatter = matterRepository.save(existingMatter)
        
        // Publish comprehensive audit event with field-level changes
        if (fieldsChanged.isNotEmpty()) {
            auditEventPublisher.publishMatterUpdated(
                matterId = id,
                fieldsChanged = fieldsChanged,
                oldValues = oldValues,
                newValues = newValues
            )
        }
        
        // Keep legacy audit for backward compatibility
        logMatterActivity(id, "UPDATED", "Matter details updated - fields: ${fieldsChanged.joinToString(", ")}")
        
        return updatedMatter
    }
    
    @Transactional
    @AuditMatterOperation(operation = "changeStatus")
    @Caching(evict = [
        CacheEvict(value = ["matter-details"], key = "#id.toString() + '_*'", allEntries = false),
        CacheEvict(value = ["matters"], allEntries = true)
    ])
    override fun updateMatterStatus(
        id: UUID,
        newStatus: MatterStatus,
        comment: String?,
        userId: UUID
    ): Matter? {
        val existingMatter = matterRepository.findById(id).orElse(null) ?: return null
        
        // Basic permission check (enhanced validation happens in StatusTransitionService)
        if (!canUserModifyMatter(existingMatter)) {
            throw InsufficientPermissionException("User cannot modify this matter")
        }
        
        // Get current user information
        val currentUser = userRepository.findById(userId).orElseThrow {
            ValidationException("userId", "User not found: $userId")
        }
        
        // Create status transition context
        val transitionContext = statusTransitionService.createTransitionContext(
            matter = existingMatter,
            newStatus = newStatus,
            reason = comment,
            userId = userId,
            userRole = currentUser.role
        )
        
        // Execute comprehensive validation and transition
        val transitionResult = statusTransitionService.executeTransition(transitionContext)
        
        // Capture old status for audit
        val oldStatus = existingMatter.status
        
        // Update matter entity with new status
        existingMatter.updateStatus(newStatus)
        
        val updatedMatter = matterRepository.save(existingMatter)
        
        // Publish comprehensive status change audit event
        auditEventPublisher.publishMatterStatusChanged(
            matterId = id,
            oldStatus = oldStatus?.name ?: "UNKNOWN",
            newStatus = newStatus.name,
            reason = comment,
            userId = userId.toString()
        )
        
        logger.info("Matter ${id} status updated from ${oldStatus} to ${newStatus} by user ${userId}")
        
        return updatedMatter
    }
    
    @Transactional
    @AuditMatterOperation(operation = "deleteMatter")
    override fun deleteMatter(id: UUID): Boolean {
        val existingMatter = matterRepository.findById(id).orElse(null) ?: return false
        
        // Check permissions
        if (!canUserModifyMatter(existingMatter)) {
            throw InsufficientPermissionException("User cannot delete this matter")
        }
        
        // Publish deletion audit event before soft delete
        auditEventPublisher.publishMatterDeleted(
            matterId = id,
            matterTitle = existingMatter.title,
            reason = "Matter deleted by user"
        )
        
        // Soft delete by setting status to CLOSED
        return updateMatterStatus(id, MatterStatus.CLOSED, "Matter deleted", getCurrentUserId()) != null
    }
    
    override fun existsByCaseNumber(caseNumber: String): Boolean {
        return matterRepository.existsByCaseNumber(caseNumber)
    }
    
    @Transactional
    @AuditLog(eventType = AuditEventType.MATTER_UPDATED, entityType = "Matter", operation = "assignLawyer")
    override fun assignLawyer(matterId: UUID, lawyerId: UUID): Matter? {
        val matter = matterRepository.findById(matterId).orElse(null) ?: return null
        val lawyer = userRepository.findById(lawyerId).orElseThrow {
            ValidationException("lawyerId", "Lawyer not found: $lawyerId")
        }
        
        // Check permissions
        if (!canUserModifyMatter(matter)) {
            throw InsufficientPermissionException("User cannot modify this matter")
        }
        
        // Validate that the user being assigned has the correct role
        // Note: In a full implementation, this would check the user's actual roles
        // For MVP, we'll just log a warning if validation is skipped
        logger.info("Assigning lawyer ${lawyer.username} to matter $matterId. Role validation should be implemented.")
        
        // Track assignment change for audit
        val oldLawyer = matter.assignedLawyer
        matter.assignedLawyer = lawyer
        val updatedMatter = matterRepository.save(matter)
        
        // Publish assignment audit event
        auditEventPublisher.publishMatterUpdated(
            matterId = matterId,
            fieldsChanged = listOf("assignedLawyer"),
            oldValues = mapOf("assignedLawyer" to oldLawyer?.username),
            newValues = mapOf("assignedLawyer" to lawyer.username),
            reason = "Lawyer assignment change"
        )
        
        logMatterActivity(matterId, "LAWYER_ASSIGNED", "Lawyer assigned: ${lawyer.username}")
        
        return updatedMatter
    }
    
    @Transactional
    @AuditLog(eventType = AuditEventType.MATTER_UPDATED, entityType = "Matter", operation = "assignClerk")
    override fun assignClerk(matterId: UUID, clerkId: UUID): Matter? {
        val matter = matterRepository.findById(matterId).orElse(null) ?: return null
        val clerk = userRepository.findById(clerkId).orElseThrow {
            ValidationException("clerkId", "Clerk not found: $clerkId")
        }
        
        // Check permissions
        if (!canUserModifyMatter(matter)) {
            throw InsufficientPermissionException("User cannot modify this matter")
        }
        
        // Validate that the user being assigned has the correct role
        // Note: In a full implementation, this would check the user's actual roles
        // For MVP, we'll just log a warning if validation is skipped
        logger.info("Assigning clerk ${clerk.username} to matter $matterId. Role validation should be implemented.")
        
        // Track assignment change for audit
        val oldClerk = matter.assignedClerk
        matter.assignedClerk = clerk
        val updatedMatter = matterRepository.save(matter)
        
        // Publish assignment audit event
        auditEventPublisher.publishMatterUpdated(
            matterId = matterId,
            fieldsChanged = listOf("assignedClerk"),
            oldValues = mapOf("assignedClerk" to oldClerk?.username),
            newValues = mapOf("assignedClerk" to clerk.username),
            reason = "Clerk assignment change"
        )
        
        logMatterActivity(matterId, "CLERK_ASSIGNED", "Clerk assigned: ${clerk.username}")
        
        return updatedMatter
    }
    
    // Private helper methods
    
    private fun validateCreateMatter(matter: Matter) {
        if (matter.caseNumber.isBlank()) {
            throw ValidationException("caseNumber", "Case number is required")
        }
        if (matter.title.isBlank()) {
            throw ValidationException("title", "Title is required")
        }
        if (matter.clientName.isBlank()) {
            throw ValidationException("clientName", "Client name is required")
        }
    }
    
    private fun validateUpdateMatter(matter: Matter) {
        if (matter.title.isBlank()) {
            throw ValidationException("title", "Title is required")
        }
        if (matter.clientName.isBlank()) {
            throw ValidationException("clientName", "Client name is required")
        }
    }
    
    private fun validateStatusTransition(matter: Matter, newStatus: MatterStatus) {
        // Additional business rules for status transitions
        when (newStatus) {
            MatterStatus.CLOSED -> {
                if (!isLawyer()) {
                    throw InsufficientPermissionException("Only lawyers can mark matters as closed")
                }
            }
            MatterStatus.TRIAL -> {
                if (!isLawyer()) {
                    throw InsufficientPermissionException("Only lawyers can mark matters as in trial")
                }
            }
            else -> {
                // Other status transitions allowed for clerks and lawyers
                if (isClient()) {
                    throw InsufficientPermissionException("Clients cannot change matter status")
                }
            }
        }
    }
    
    private fun canUserAccessMatter(matter: Matter): Boolean {
        return when {
            isLawyer() -> true // Lawyers can access all matters
            isClerk() -> {
                // Clerks can access matters they are assigned to or where assigned lawyer matches
                matter.assignedClerk?.id == getCurrentUserId() || 
                matter.assignedLawyer?.id == getCurrentUserId()
            }
            isClient() -> {
                // Clients can only access their own matters
                // For MVP: Use email-based association (assuming username is email)
                val currentUsername = getCurrentUsername()
                currentUsername != null && 
                matter.clientContact?.equals(currentUsername, ignoreCase = true) == true
            }
            else -> false
        }
    }
    
    private fun canUserModifyMatter(matter: Matter): Boolean {
        return when {
            isLawyer() -> true // Lawyers can modify all matters
            isClerk() -> {
                // Clerks can modify matters they are assigned to
                matter.assignedClerk?.id == getCurrentUserId() ||
                matter.assignedLawyer?.id == getCurrentUserId()
            }
            else -> false // Clients cannot modify matters
        }
    }
    
    @Transactional
    @AuditLog(eventType = AuditEventType.MATTER_BULK_UPDATED, entityType = "Matter", operation = "bulkUpdate")
    override fun bulkUpdateMatters(
        matterIds: List<UUID>,
        updates: Map<String, Any?>,
        validateTransitions: Boolean,
        stopOnFirstError: Boolean
    ): BulkMatterOperationResult {
        val result = BulkMatterOperationResult(
            totalRequested = matterIds.size,
            totalProcessed = 0,
            totalSuccessful = 0,
            totalFailed = 0,
            totalSkipped = 0,
            errors = mutableListOf(),
            warnings = mutableListOf(),
            updatedMatterIds = mutableListOf(),
            skippedMatterIds = mutableListOf()
        )
        
        var processed = 0
        var successful = 0
        val errors = mutableListOf<MatterOperationError>()
        val warnings = mutableListOf<String>()
        val updatedIds = mutableListOf<UUID>()
        val skippedIds = mutableListOf<UUID>()
        
        try {\n            matterIds.forEach { matterId ->\n                try {\n                    val matter = matterRepository.findById(matterId).orElse(null)\n                    if (matter == null) {\n                        errors.add(MatterOperationError(\n                            matterId = matterId,\n                            errorCode = \"NOT_FOUND\",\n                            errorMessage = \"Matter not found or access denied\"\n                        ))\n                        return@forEach\n                    }\n                    \n                    // Check permissions\n                    if (!canUserModifyMatter(matter)) {\n                        errors.add(MatterOperationError(\n                            matterId = matterId,\n                            errorCode = \"ACCESS_DENIED\",\n                            errorMessage = \"User cannot modify this matter\"\n                        ))\n                        return@forEach\n                    }\n                    \n                    // Validate and apply updates\n                    var hasChanges = false\n                    val changeLog = mutableListOf<String>()\n                    \n                    updates.forEach { (field, value) ->\n                        try {\n                            when (field) {\n                                \"status\" -> {\n                                    val newStatus = value as? MatterStatus\n                                    if (newStatus != null && newStatus != matter.status) {\n                                        if (validateTransitions && !matter.status.canTransitionTo(newStatus)) {\n                                            errors.add(MatterOperationError(\n                                                matterId = matterId,\n                                                errorCode = \"INVALID_TRANSITION\",\n                                                errorMessage = \"Invalid status transition from ${matter.status} to $newStatus\",\n                                                field = field,\n                                                currentValue = matter.status,\n                                                attemptedValue = newStatus\n                                            ))\n                                            return@forEach\n                                        }\n                                        matter.updateStatus(newStatus)\n                                        changeLog.add(\"status: ${matter.status} -> $newStatus\")\n                                        hasChanges = true\n                                    }\n                                }\n                                \"priority\" -> {\n                                    val newPriority = value as? dev.ryuzu.astermanagement.domain.matter.MatterPriority\n                                    if (newPriority != null && newPriority != matter.priority) {\n                                        matter.priority = newPriority\n                                        changeLog.add(\"priority: ${matter.priority} -> $newPriority\")\n                                        hasChanges = true\n                                    }\n                                }\n                                \"assignedLawyerId\" -> {\n                                    val lawyerId = value as? UUID\n                                    val newLawyer = lawyerId?.let { userRepository.findById(it).orElse(null) }\n                                    if (newLawyer != matter.assignedLawyer) {\n                                        matter.assignedLawyer = newLawyer\n                                        changeLog.add(\"assignedLawyer: ${matter.assignedLawyer?.username} -> ${newLawyer?.username}\")\n                                        hasChanges = true\n                                    }\n                                }\n                                \"assignedClerkId\" -> {\n                                    val clerkId = value as? UUID\n                                    val newClerk = clerkId?.let { userRepository.findById(it).orElse(null) }\n                                    if (newClerk != matter.assignedClerk) {\n                                        matter.assignedClerk = newClerk\n                                        changeLog.add(\"assignedClerk: ${matter.assignedClerk?.username} -> ${newClerk?.username}\")\n                                        hasChanges = true\n                                    }\n                                }\n                                \"notes\" -> {\n                                    val newNotes = value as? String\n                                    if (newNotes != matter.notes) {\n                                        matter.notes = newNotes\n                                        changeLog.add(\"notes updated\")\n                                        hasChanges = true\n                                    }\n                                }\n                                \"addTags\" -> {\n                                    val tagsToAdd = (value as? List<*>)?.filterIsInstance<String>() ?: emptyList()\n                                    tagsToAdd.forEach { tag ->\n                                        if (!matter.hasTag(tag)) {\n                                            matter.addTag(tag)\n                                            hasChanges = true\n                                        }\n                                    }\n                                    if (tagsToAdd.isNotEmpty()) {\n                                        changeLog.add(\"added tags: ${tagsToAdd.joinToString(\", \")}\")\n                                    }\n                                }\n                                \"removeTags\" -> {\n                                    val tagsToRemove = (value as? List<*>)?.filterIsInstance<String>() ?: emptyList()\n                                    tagsToRemove.forEach { tag ->\n                                        if (matter.hasTag(tag)) {\n                                            matter.removeTag(tag)\n                                            hasChanges = true\n                                        }\n                                    }\n                                    if (tagsToRemove.isNotEmpty()) {\n                                        changeLog.add(\"removed tags: ${tagsToRemove.joinToString(\", \")}\")\n                                    }\n                                }\n                                else -> {\n                                    warnings.add(\"Unknown field '$field' ignored for matter $matterId\")\n                                }\n                            }\n                        } catch (e: Exception) {\n                            errors.add(MatterOperationError(\n                                matterId = matterId,\n                                errorCode = \"UPDATE_FAILED\",\n                                errorMessage = \"Failed to update field '$field': ${e.message}\",\n                                field = field,\n                                attemptedValue = value\n                            ))\n                            if (stopOnFirstError) return@forEach\n                        }\n                    }\n                    \n                    if (hasChanges) {\n                        matterRepository.save(matter)\n                        updatedIds.add(matterId)\n                        successful++\n                        \n                        // Log audit event\n                        auditEventPublisher.publishMatterUpdated(\n                            matterId = matterId,\n                            fieldsChanged = changeLog,\n                            oldValues = mapOf(),\n                            newValues = mapOf(),\n                            reason = \"Bulk update operation\"\n                        )\n                        \n                        logger.debug(\"Bulk updated matter $matterId: ${changeLog.joinToString(\", \")}\")\n                    } else {\n                        skippedIds.add(matterId)\n                        warnings.add(\"No changes applied to matter $matterId\")\n                    }\n                    \n                } catch (e: Exception) {\n                    logger.error(\"Error processing matter $matterId in bulk update\", e)\n                    errors.add(MatterOperationError(\n                        matterId = matterId,\n                        errorCode = \"PROCESSING_ERROR\",\n                        errorMessage = \"Error processing matter: ${e.message}\"\n                    ))\n                    \n                    if (stopOnFirstError) {\n                        throw e\n                    }\n                } finally {\n                    processed++\n                }\n            }\n            \n        } catch (e: Exception) {\n            logger.error(\"Bulk update operation failed\", e)\n            throw BusinessException(\"Bulk update operation failed: ${e.message}\")\n        }\n        \n        val finalResult = BulkMatterOperationResult(\n            totalRequested = matterIds.size,\n            totalProcessed = processed,\n            totalSuccessful = successful,\n            totalFailed = errors.size,\n            totalSkipped = skippedIds.size,\n            errors = errors,\n            warnings = warnings,\n            updatedMatterIds = updatedIds,\n            skippedMatterIds = skippedIds\n        )\n        \n        // Log summary\n        logger.info(\"Bulk update completed: ${successful}/${matterIds.size} matters updated, ${errors.size} errors\")\n        \n        return finalResult\n    }\n    \n    @Transactional\n    @AuditLog(eventType = AuditEventType.MATTER_BULK_DELETED, entityType = \"Matter\", operation = \"bulkDelete\")\n    override fun bulkDeleteMatters(\n        matterIds: List<UUID>,\n        reason: String,\n        forceDelete: Boolean\n    ): BulkMatterOperationResult {\n        val errors = mutableListOf<MatterOperationError>()\n        val warnings = mutableListOf<String>()\n        val deletedIds = mutableListOf<UUID>()\n        val skippedIds = mutableListOf<UUID>()\n        var processed = 0\n        var successful = 0\n        \n        try {\n            matterIds.forEach { matterId ->\n                try {\n                    val matter = matterRepository.findById(matterId).orElse(null)\n                    if (matter == null) {\n                        errors.add(MatterOperationError(\n                            matterId = matterId,\n                            errorCode = \"NOT_FOUND\",\n                            errorMessage = \"Matter not found or access denied\"\n                        ))\n                        return@forEach\n                    }\n                    \n                    // Check permissions\n                    if (!canUserModifyMatter(matter)) {\n                        errors.add(MatterOperationError(\n                            matterId = matterId,\n                            errorCode = \"ACCESS_DENIED\",\n                            errorMessage = \"User cannot delete this matter\"\n                        ))\n                        return@forEach\n                    }\n                    \n                    // Check if matter can be deleted\n                    if (!forceDelete && matter.status != MatterStatus.CLOSED) {\n                        errors.add(MatterOperationError(\n                            matterId = matterId,\n                            errorCode = \"INVALID_STATUS\",\n                            errorMessage = \"Can only delete closed matters (use forceDelete to override)\",\n                            field = \"status\",\n                            currentValue = matter.status\n                        ))\n                        return@forEach\n                    }\n                    \n                    // Perform soft delete by setting status to CLOSED\n                    if (matter.status != MatterStatus.CLOSED) {\n                        matter.updateStatus(MatterStatus.CLOSED)\n                    }\n                    \n                    matterRepository.save(matter)\n                    deletedIds.add(matterId)\n                    successful++\n                    \n                    // Log audit event\n                    auditEventPublisher.publishMatterDeleted(\n                        matterId = matterId,\n                        matterTitle = matter.title,\n                        reason = \"Bulk delete: $reason\"\n                    )\n                    \n                    logger.debug(\"Bulk deleted matter $matterId: ${matter.title}\")\n                    \n                } catch (e: Exception) {\n                    logger.error(\"Error deleting matter $matterId in bulk operation\", e)\n                    errors.add(MatterOperationError(\n                        matterId = matterId,\n                        errorCode = \"DELETE_FAILED\",\n                        errorMessage = \"Failed to delete matter: ${e.message}\"\n                    ))\n                } finally {\n                    processed++\n                }\n            }\n            \n        } catch (e: Exception) {\n            logger.error(\"Bulk delete operation failed\", e)\n            throw BusinessException(\"Bulk delete operation failed: ${e.message}\")\n        }\n        \n        val result = BulkMatterOperationResult(\n            totalRequested = matterIds.size,\n            totalProcessed = processed,\n            totalSuccessful = successful,\n            totalFailed = errors.size,\n            totalSkipped = skippedIds.size,\n            errors = errors,\n            warnings = warnings,\n            updatedMatterIds = deletedIds,\n            skippedMatterIds = skippedIds\n        )\n        \n        logger.info(\"Bulk delete completed: ${successful}/${matterIds.size} matters deleted, ${errors.size} errors\")\n        \n        return result\n    }\n    \n    override fun validateBulkMatterUpdates(\n        matterIds: List<UUID>,\n        updates: Map<String, Any?>\n    ): List<MatterValidationError> {\n        val errors = mutableListOf<MatterValidationError>()\n        \n        matterIds.forEach { matterId ->\n            val matter = matterRepository.findById(matterId).orElse(null)\n            if (matter == null) {\n                errors.add(MatterValidationError(\n                    matterId = matterId,\n                    field = \"matter\",\n                    errorMessage = \"Matter not found or access denied\",\n                    violatedRule = \"EXISTENCE_CHECK\"\n                ))\n                return@forEach\n            }\n            \n            // Check permissions\n            if (!canUserAccessMatter(matter)) {\n                errors.add(MatterValidationError(\n                    matterId = matterId,\n                    field = \"access\",\n                    errorMessage = \"User cannot access this matter\",\n                    violatedRule = \"ACCESS_CONTROL\"\n                ))\n                return@forEach\n            }\n            \n            // Validate each update field\n            updates.forEach { (field, value) ->\n                when (field) {\n                    \"status\" -> {\n                        val newStatus = value as? MatterStatus\n                        if (newStatus != null && !matter.status.canTransitionTo(newStatus)) {\n                            errors.add(MatterValidationError(\n                                matterId = matterId,\n                                field = field,\n                                errorMessage = \"Invalid status transition from ${matter.status} to $newStatus\",\n                                currentValue = matter.status,\n                                attemptedValue = newStatus,\n                                violatedRule = \"STATUS_TRANSITION\"\n                            ))\n                        }\n                    }\n                    \"assignedLawyerId\" -> {\n                        val lawyerId = value as? UUID\n                        if (lawyerId != null && !userRepository.existsById(lawyerId)) {\n                            errors.add(MatterValidationError(\n                                matterId = matterId,\n                                field = field,\n                                errorMessage = \"Assigned lawyer not found: $lawyerId\",\n                                attemptedValue = lawyerId,\n                                violatedRule = \"REFERENCE_INTEGRITY\"\n                            ))\n                        }\n                    }\n                    \"assignedClerkId\" -> {\n                        val clerkId = value as? UUID\n                        if (clerkId != null && !userRepository.existsById(clerkId)) {\n                            errors.add(MatterValidationError(\n                                matterId = matterId,\n                                field = field,\n                                errorMessage = \"Assigned clerk not found: $clerkId\",\n                                attemptedValue = clerkId,\n                                violatedRule = \"REFERENCE_INTEGRITY\"\n                            ))\n                        }\n                    }\n                    \"notes\" -> {\n                        val notes = value as? String\n                        if (notes != null && notes.length > 2000) {\n                            errors.add(MatterValidationError(\n                                matterId = matterId,\n                                field = field,\n                                errorMessage = \"Notes exceed maximum length of 2000 characters\",\n                                attemptedValue = notes.length,\n                                violatedRule = \"LENGTH_VALIDATION\"\n                            ))\n                        }\n                    }\n                }\n            }\n        }\n        \n        return errors\n    }\n\n    private fun logMatterActivity(matterId: UUID, action: String, description: String) {\n        auditService.recordMatterEvent(matterId, action, description)\n        logger.info(\"AUDIT: Matter $matterId - $action: $description by user ${getCurrentUserId()}\")\n    }\n}