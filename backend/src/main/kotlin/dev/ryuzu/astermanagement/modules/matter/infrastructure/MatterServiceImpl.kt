package dev.ryuzu.astermanagement.modules.matter.infrastructure

import dev.ryuzu.astermanagement.modules.matter.api.MatterService
import dev.ryuzu.astermanagement.modules.matter.api.MatterStatistics
import dev.ryuzu.astermanagement.modules.matter.api.dto.*
import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterRepository
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import dev.ryuzu.astermanagement.modules.matter.api.*
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Implementation of Matter module's public API
 */
@Service
@Transactional
class MatterServiceImpl(
    private val matterRepository: MatterRepository,
    private val userRepository: UserRepository,
    private val auditEventPublisher: AuditEventPublisher,
    private val applicationEventPublisher: ApplicationEventPublisher
) : MatterService {

    override fun createMatter(request: CreateMatterRequest): MatterDTO {
        val assignedLawyer = userRepository.findById(request.assignedLawyerId)
            .orElseThrow { IllegalArgumentException("Assigned lawyer not found") }
        
        val assignedClerk = request.assignedClerkId?.let { clerkId ->
            userRepository.findById(clerkId)
                .orElseThrow { IllegalArgumentException("Assigned clerk not found") }
        }
        
        val client = request.clientId?.let { clientId ->
            userRepository.findById(clientId)
                .orElseThrow { IllegalArgumentException("Client not found") }
        }

        val matter = Matter().apply {
            caseNumber = request.caseNumber
            title = request.title
            description = request.description
            this.client = client
            clientName = request.clientName
            clientContact = request.clientContact
            opposingParty = request.opposingParty
            courtName = request.courtName
            filingDate = request.filingDate
            estimatedCompletionDate = request.estimatedCompletionDate
            priority = request.priority.toDomain()
            this.assignedLawyer = assignedLawyer
            this.assignedClerk = assignedClerk
            notes = request.notes
            request.tags.forEach { addTag(it) }
        }

        val savedMatter = matterRepository.save(matter)
        
        // Publish events
        val event = MatterCreatedEvent(
            matterId = savedMatter.id!!,
            caseNumber = savedMatter.caseNumber,
            title = savedMatter.title,
            clientId = savedMatter.client?.id,
            assignedLawyerId = savedMatter.assignedLawyer!!.id!!,
            userId = assignedLawyer.id!!
        )
        applicationEventPublisher.publishEvent(event)
        
        auditEventPublisher.publishMatterCreated(
            matterId = savedMatter.id!!,
            caseNumber = savedMatter.caseNumber,
            userId = assignedLawyer.id!!
        )

        return savedMatter.toDTO()
    }

    @Transactional(readOnly = true)
    override fun getMatterById(id: UUID): MatterDTO? {
        return matterRepository.findById(id).orElse(null)?.toDTO()
    }

    @Transactional(readOnly = true)
    override fun getMatterByCaseNumber(caseNumber: String): MatterDTO? {
        return matterRepository.findByCaseNumber(caseNumber)?.toDTO()
    }

    override fun updateMatter(id: UUID, request: UpdateMatterRequest): MatterDTO {
        val matter = matterRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Matter not found") }
        
        val changes = mutableMapOf<String, Any?>()
        
        request.title?.let { 
            changes["title"] = matter.title to it
            matter.title = it 
        }
        request.description?.let { 
            changes["description"] = matter.description to it
            matter.description = it 
        }
        request.clientContact?.let { 
            changes["clientContact"] = matter.clientContact to it
            matter.clientContact = it 
        }
        request.opposingParty?.let { 
            changes["opposingParty"] = matter.opposingParty to it
            matter.opposingParty = it 
        }
        request.courtName?.let { 
            changes["courtName"] = matter.courtName to it
            matter.courtName = it 
        }
        request.filingDate?.let { 
            changes["filingDate"] = matter.filingDate to it
            matter.filingDate = it 
        }
        request.estimatedCompletionDate?.let { 
            changes["estimatedCompletionDate"] = matter.estimatedCompletionDate to it
            matter.estimatedCompletionDate = it 
        }
        request.actualCompletionDate?.let { 
            changes["actualCompletionDate"] = matter.actualCompletionDate to it
            matter.actualCompletionDate = it 
        }
        request.priority?.let { 
            changes["priority"] = matter.priority to it.toDomain()
            matter.priority = it.toDomain()
        }
        request.assignedLawyerId?.let { lawyerId ->
            val lawyer = userRepository.findById(lawyerId)
                .orElseThrow { IllegalArgumentException("Assigned lawyer not found") }
            changes["assignedLawyer"] = matter.assignedLawyer?.id to lawyerId
            matter.assignedLawyer = lawyer
        }
        request.assignedClerkId?.let { clerkId ->
            val clerk = userRepository.findById(clerkId)
                .orElseThrow { IllegalArgumentException("Assigned clerk not found") }
            changes["assignedClerk"] = matter.assignedClerk?.id to clerkId
            matter.assignedClerk = clerk
        }
        request.notes?.let { 
            changes["notes"] = matter.notes to it
            matter.notes = it 
        }
        request.tags?.let { newTags ->
            changes["tags"] = matter.tags.toList() to newTags
            matter.tags = emptyArray()
            newTags.forEach { matter.addTag(it) }
        }

        val savedMatter = matterRepository.save(matter)
        
        // Publish update event
        if (changes.isNotEmpty()) {
            val event = MatterUpdatedEvent(
                matterId = savedMatter.id!!,
                changes = changes,
                userId = savedMatter.assignedLawyer!!.id!!
            )
            applicationEventPublisher.publishEvent(event)
            
            auditEventPublisher.publishMatterUpdated(
                matterId = savedMatter.id!!,
                changes = changes.keys.toList(),
                userId = savedMatter.assignedLawyer!!.id!!
            )
        }

        return savedMatter.toDTO()
    }

    override fun deleteMatter(id: UUID) {
        val matter = matterRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Matter not found") }
        
        matterRepository.delete(matter)
        
        // Publish delete event
        val event = MatterDeletedEvent(
            matterId = id,
            userId = matter.assignedLawyer!!.id!!
        )
        applicationEventPublisher.publishEvent(event)
        
        auditEventPublisher.publishMatterDeleted(
            matterId = id,
            userId = matter.assignedLawyer!!.id!!
        )
    }

    @Transactional(readOnly = true)
    override fun getMattersByLawyer(lawyerId: UUID, pageable: Pageable): Page<MatterDTO> {
        val lawyer = userRepository.findById(lawyerId)
            .orElseThrow { IllegalArgumentException("Lawyer not found") }
        
        return matterRepository.findByAssignedLawyer(lawyer, pageable)
            .map { it.toDTO() }
    }

    @Transactional(readOnly = true)
    override fun getMattersByClient(clientId: UUID, pageable: Pageable): Page<MatterDTO> {
        return matterRepository.findAll(pageable)
            .map { it.toDTO() }
            .filter { it.clientId == clientId }
            .let { matters ->
                // Convert to Page manually (simplified for this implementation)
                val mattersList = matters.toList()
                org.springframework.data.domain.PageImpl(mattersList, pageable, mattersList.size.toLong())
            }
    }

    @Transactional(readOnly = true)
    override fun searchMatters(
        query: String?,
        status: String?,
        priority: String?,
        assignedLawyerId: UUID?,
        clientId: UUID?,
        pageable: Pageable
    ): Page<MatterDTO> {
        val statusEnum = status?.let { MatterStatus.valueOf(it.uppercase()) }
        val priorityEnum = priority?.let { MatterPriority.valueOf(it.uppercase()) }
        val assignedLawyer = assignedLawyerId?.let { 
            userRepository.findById(it).orElse(null)
        }
        
        return matterRepository.searchMatters(
            caseNumber = query,
            clientName = query,
            title = query,
            status = statusEnum,
            priority = priorityEnum,
            assignedLawyer = assignedLawyer,
            pageable = pageable
        ).map { it.toDTO() }
    }

    override fun updateMatterStatus(id: UUID, newStatus: String, userId: UUID): MatterDTO {
        val matter = matterRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Matter not found") }
        
        val oldStatus = matter.status
        val newStatusEnum = MatterStatus.valueOf(newStatus.uppercase())
        
        if (!oldStatus.canTransitionTo(newStatusEnum)) {
            throw IllegalArgumentException("Invalid status transition from $oldStatus to $newStatusEnum")
        }
        
        matter.updateStatus(newStatusEnum)
        val savedMatter = matterRepository.save(matter)
        
        // Publish status change event
        val event = MatterStatusChangedEvent(
            matterId = savedMatter.id!!,
            oldStatus = oldStatus.name,
            newStatus = newStatusEnum.name,
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)
        
        auditEventPublisher.publishMatterStatusChanged(
            matterId = savedMatter.id!!,
            oldStatus = oldStatus.name,
            newStatus = newStatusEnum.name,
            userId = userId
        )

        return savedMatter.toDTO()
    }

    @Transactional(readOnly = true)
    override fun getMatterStatistics(lawyerId: UUID?): MatterStatistics {
        val totalMatters = matterRepository.count()
        val activeMatters = matterRepository.countByStatus(MatterStatus.CLOSED).let { totalMatters - it }
        val overdueMatters = matterRepository.findOverdueMatters().size.toLong()
        
        // Simplified statistics calculation
        return MatterStatistics(
            totalMatters = totalMatters,
            activeMatters = activeMatters,
            overdueMatters = overdueMatters,
            completedThisMonth = 0, // Would need more complex query
            averageCompletionDays = null // Would need more complex calculation
        )
    }

    @Transactional(readOnly = true)
    override fun hasAccessToMatter(matterId: UUID, userId: UUID): Boolean {
        val matter = matterRepository.findById(matterId).orElse(null) ?: return false
        val user = userRepository.findById(userId).orElse(null) ?: return false
        
        return matter.assignedLawyer?.id == userId ||
               matter.assignedClerk?.id == userId ||
               matter.client?.id == userId
    }

    // Extension functions for domain/DTO conversion
    private fun Matter.toDTO(): MatterDTO {
        return MatterDTO(
            id = this.id!!,
            caseNumber = this.caseNumber,
            title = this.title,
            description = this.description,
            clientId = this.client?.id,
            clientName = this.clientName,
            clientContact = this.clientContact,
            opposingParty = this.opposingParty,
            courtName = this.courtName,
            filingDate = this.filingDate,
            estimatedCompletionDate = this.estimatedCompletionDate,
            actualCompletionDate = this.actualCompletionDate,
            status = this.status.toDTO(),
            priority = this.priority.toDTO(),
            assignedLawyerId = this.assignedLawyer?.id,
            assignedLawyerName = this.assignedLawyer?.username,
            assignedClerkId = this.assignedClerk?.id,
            assignedClerkName = this.assignedClerk?.username,
            notes = this.notes,
            tags = this.tags.toList(),
            isActive = this.isActive,
            isOverdue = this.isOverdue,
            isCompleted = this.isCompleted,
            ageInDays = this.ageInDays,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt
        )
    }

    private fun MatterStatus.toDTO(): MatterStatusDTO = MatterStatusDTO.valueOf(this.name)
    private fun MatterPriority.toDTO(): MatterPriorityDTO = MatterPriorityDTO.valueOf(this.name)
    private fun MatterStatusDTO.toDomain(): MatterStatus = MatterStatus.valueOf(this.name)
    private fun MatterPriorityDTO.toDomain(): MatterPriority = MatterPriority.valueOf(this.name)
}