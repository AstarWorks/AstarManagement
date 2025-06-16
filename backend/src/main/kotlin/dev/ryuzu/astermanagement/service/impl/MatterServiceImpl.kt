package dev.ryuzu.astermanagement.service.impl

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.service.AuditService
import dev.ryuzu.astermanagement.service.MatterService
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
    private val auditService: AuditService
) : BaseService(), MatterService {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    @Transactional
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
        
        // Log the creation for audit trail
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
    override fun updateMatter(id: UUID, matter: Matter): Matter? {
        val existingMatter = matterRepository.findById(id).orElse(null) ?: return null
        
        // Check permissions
        if (!canUserModifyMatter(existingMatter)) {
            throw InsufficientPermissionException("User cannot modify this matter")
        }
        
        validateUpdateMatter(matter)
        
        // Update fields while preserving certain metadata
        existingMatter.apply {
            title = matter.title
            description = matter.description
            clientName = matter.clientName
            clientContact = matter.clientContact
            opposingParty = matter.opposingParty
            courtName = matter.courtName
            filingDate = matter.filingDate
            estimatedCompletionDate = matter.estimatedCompletionDate
            notes = matter.notes
            tags = matter.tags
            // Do not update status here - use updateMatterStatus for that
            // Do not update creation metadata
        }
        
        val updatedMatter = matterRepository.save(existingMatter)
        
        // Log the update for audit trail
        logMatterActivity(id, "UPDATED", "Matter details updated")
        
        return updatedMatter
    }
    
    @Transactional
    override fun updateMatterStatus(
        id: UUID,
        newStatus: MatterStatus,
        comment: String?,
        userId: UUID
    ): Matter? {
        val existingMatter = matterRepository.findById(id).orElse(null) ?: return null
        
        // Check permissions for status transitions
        validateStatusTransition(existingMatter, newStatus)
        
        if (!canUserModifyMatter(existingMatter)) {
            throw InsufficientPermissionException("User cannot modify this matter")
        }
        
        // Validate the status transition
        if (!existingMatter.status.canTransitionTo(newStatus)) {
            throw InvalidStatusTransitionException(
                existingMatter.status.name,
                newStatus.name
            )
        }
        
        val oldStatus = existingMatter.status
        existingMatter.updateStatus(newStatus)
        
        val updatedMatter = matterRepository.save(existingMatter)
        
        // Log the status change for audit trail
        val statusComment = comment?.let { " - $it" } ?: ""
        logMatterActivity(
            id, 
            "STATUS_CHANGED", 
            "Status changed from $oldStatus to $newStatus$statusComment"
        )
        
        return updatedMatter
    }
    
    @Transactional
    override fun deleteMatter(id: UUID): Boolean {
        val existingMatter = matterRepository.findById(id).orElse(null) ?: return false
        
        // Check permissions
        if (!canUserModifyMatter(existingMatter)) {
            throw InsufficientPermissionException("User cannot delete this matter")
        }
        
        // Soft delete by setting status to CLOSED
        return updateMatterStatus(id, MatterStatus.CLOSED, "Matter deleted", getCurrentUserId()) != null
    }
    
    override fun existsByCaseNumber(caseNumber: String): Boolean {
        return matterRepository.existsByCaseNumber(caseNumber)
    }
    
    @Transactional
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
        
        matter.assignedLawyer = lawyer
        val updatedMatter = matterRepository.save(matter)
        
        logMatterActivity(matterId, "LAWYER_ASSIGNED", "Lawyer assigned: ${lawyer.username}")
        
        return updatedMatter
    }
    
    @Transactional
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
        
        matter.assignedClerk = clerk
        val updatedMatter = matterRepository.save(matter)
        
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