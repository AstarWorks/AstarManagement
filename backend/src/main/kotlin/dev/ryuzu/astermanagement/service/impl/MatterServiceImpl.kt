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
    
    override fun getMatterById(id: UUID): Matter? {
        val matter = matterRepository.findById(id).orElse(null) ?: return null
        
        // Apply security filtering
        if (!canUserAccessMatter(matter)) {
            throw InsufficientPermissionException("User cannot access this matter")
        }
        
        return matter
    }
    
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
    
    private fun logMatterActivity(matterId: UUID, action: String, description: String) {
        auditService.recordMatterEvent(matterId, action, description)
        logger.info("AUDIT: Matter $matterId - $action: $description by user ${getCurrentUserId()}")
    }
}