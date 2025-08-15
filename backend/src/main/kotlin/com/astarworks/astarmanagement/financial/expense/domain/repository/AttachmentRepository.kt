package com.astarworks.astarmanagement.modules.financial.expense.domain.repository

import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Attachment
import java.time.Instant
import java.util.UUID

/**
 * Repository interface for managing Attachment entities following DDD patterns.
 * 
 * All methods include tenant isolation to ensure data segregation.
 * This is a domain interface that should be implemented by infrastructure layer.
 */
interface AttachmentRepository {
    
    /**
     * Saves an attachment entity.
     * 
     * @param attachment The attachment to save
     * @return The saved attachment
     */
    fun save(attachment: Attachment): Attachment
    
    /**
     * Finds an attachment by its ID.
     * 
     * @param id The attachment ID
     * @return The attachment if found, null otherwise
     */
    fun findById(id: UUID): Attachment?
    
    /**
     * Finds an attachment by ID with tenant isolation.
     * 
     * @param id The attachment ID
     * @param tenantId The tenant ID for isolation
     * @return The attachment if found and belongs to tenant, null otherwise
     */
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Attachment?
    
    /**
     * Finds all attachments for a specific expense.
     * 
     * @param expenseId The expense ID
     * @return List of attachments for the expense
     */
    fun findByExpenseId(expenseId: UUID): List<Attachment>
    
    /**
     * Finds temporary attachments that have expired.
     * Used for cleanup of unlinked temporary files.
     * 
     * @param expiryDate The date to check expiry against
     * @return List of expired temporary attachments
     */
    fun findExpiredTemporary(expiryDate: Instant): List<Attachment>
    
    /**
     * Deletes an attachment (soft delete).
     * 
     * @param attachment The attachment to delete
     */
    fun delete(attachment: Attachment)
}