package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Attachment
import com.astarworks.astarmanagement.expense.domain.model.AttachmentStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

/**
 * Spring Data JPA repository for Attachment entities.
 * 
 * This interface extends JpaRepository and provides custom query methods
 * for attachment-specific operations with tenant isolation.
 */
@Repository
interface JpaAttachmentRepository : JpaRepository<Attachment, UUID> {
    
    /**
     * Finds an attachment by ID with tenant isolation.
     */
    @Query("""
        SELECT a FROM Attachment a 
        WHERE a.id = :id 
        AND a.tenantId = :tenantId 
        AND a.deletedAt IS NULL
    """)
    fun findByIdAndTenantId(
        @Param("id") id: UUID,
        @Param("tenantId") tenantId: UUID
    ): Attachment?
    
    /**
     * Finds all attachments for a specific expense.
     * This requires joining through the ExpenseAttachment entity.
     */
    @Query("""
        SELECT a FROM Attachment a
        JOIN ExpenseAttachment ea ON ea.attachment.id = a.id
        WHERE ea.expense.id = :expenseId
        AND a.deletedAt IS NULL
        ORDER BY a.uploadedAt
    """)
    fun findByExpenseId(
        @Param("expenseId") expenseId: UUID
    ): List<Attachment>
    
    /**
     * Finds temporary attachments that have expired.
     * Used for cleanup of unlinked temporary files.
     */
    @Query("""
        SELECT a FROM Attachment a
        WHERE a.status = :status
        AND a.expiresAt < :expiryDate
        AND a.deletedAt IS NULL
    """)
    fun findExpiredTemporaryAttachments(
        @Param("status") status: AttachmentStatus = AttachmentStatus.TEMPORARY,
        @Param("expiryDate") expiryDate: Instant
    ): List<Attachment>
    
    /**
     * Finds attachments by status for a tenant.
     */
    @Query("""
        SELECT a FROM Attachment a
        WHERE a.tenantId = :tenantId
        AND a.status = :status
        AND a.deletedAt IS NULL
        ORDER BY a.uploadedAt DESC
    """)
    fun findByTenantIdAndStatus(
        @Param("tenantId") tenantId: UUID,
        @Param("status") status: AttachmentStatus
    ): List<Attachment>
    
    /**
     * Counts attachments for an expense.
     */
    @Query("""
        SELECT COUNT(a) FROM Attachment a
        JOIN ExpenseAttachment ea ON ea.attachment.id = a.id
        WHERE ea.expense.id = :expenseId
        AND a.deletedAt IS NULL
    """)
    fun countByExpenseId(
        @Param("expenseId") expenseId: UUID
    ): Long
    
    /**
     * Checks if an attachment exists and is linked to any expense.
     */
    @Query("""
        SELECT CASE WHEN COUNT(ea) > 0 THEN true ELSE false END
        FROM ExpenseAttachment ea
        WHERE ea.attachment.id = :attachmentId
    """)
    fun isAttachmentLinked(
        @Param("attachmentId") attachmentId: UUID
    ): Boolean
    
    /**
     * Finds orphaned attachments (not linked to any expense).
     * Useful for cleanup operations.
     */
    @Query("""
        SELECT a FROM Attachment a
        WHERE a.tenantId = :tenantId
        AND a.status = :status
        AND NOT EXISTS (
            SELECT 1 FROM ExpenseAttachment ea
            WHERE ea.attachment.id = a.id
        )
        AND a.deletedAt IS NULL
        AND a.uploadedAt < :beforeDate
    """)
    fun findOrphanedAttachments(
        @Param("tenantId") tenantId: UUID,
        @Param("status") status: AttachmentStatus,
        @Param("beforeDate") beforeDate: Instant
    ): List<Attachment>
}