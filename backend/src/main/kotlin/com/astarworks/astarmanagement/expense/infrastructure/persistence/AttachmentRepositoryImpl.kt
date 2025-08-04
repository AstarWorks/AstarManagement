package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Attachment
import com.astarworks.astarmanagement.expense.domain.repository.AttachmentRepository
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

/**
 * Implementation of AttachmentRepository using Spring Data JPA.
 * 
 * This class bridges the domain repository interface with the JPA repository,
 * handling the translation between domain operations and persistence operations.
 */
@Component
class AttachmentRepositoryImpl(
    private val jpaAttachmentRepository: JpaAttachmentRepository
) : AttachmentRepository {
    
    override fun save(attachment: Attachment): Attachment {
        return jpaAttachmentRepository.save(attachment)
    }
    
    override fun findById(id: UUID): Attachment? {
        return jpaAttachmentRepository.findById(id)
            .filter { it.deletedAt == null }
            .orElse(null)
    }
    
    override fun findByIdAndTenantId(id: UUID, tenantId: UUID): Attachment? {
        return jpaAttachmentRepository.findByIdAndTenantId(id, tenantId)
    }
    
    override fun findByExpenseId(expenseId: UUID): List<Attachment> {
        return jpaAttachmentRepository.findByExpenseId(expenseId)
    }
    
    override fun findExpiredTemporary(expiryDate: Instant): List<Attachment> {
        return jpaAttachmentRepository.findExpiredTemporaryAttachments(
            expiryDate = expiryDate
        )
    }
    
    override fun delete(attachment: Attachment) {
        // Soft delete is handled by the entity's markDeleted method
        // Note: In a real implementation, userId would come from security context
        val userId = UUID.randomUUID() // TODO: Get from security context
        attachment.markDeleted(userId)
        jpaAttachmentRepository.save(attachment)
    }
}