package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Attachment
import com.astarworks.astarmanagement.expense.domain.model.AttachmentNotFoundException
import com.astarworks.astarmanagement.expense.domain.model.InsufficientPermissionException
import com.astarworks.astarmanagement.expense.domain.repository.AttachmentRepository
import com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
import org.springframework.stereotype.Component
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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
    private val jpaAttachmentRepository: JpaAttachmentRepository,
    private val securityContextService: SecurityContextService
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
        val currentTenantId = securityContextService.getCurrentTenantId()
        if (currentTenantId != null && currentTenantId != tenantId) {
            throw InsufficientPermissionException("access attachment from different tenant")
        }
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
        // Business logic for soft delete is now handled in the service layer
        jpaAttachmentRepository.save(attachment)
    }
}