package com.astarworks.astarmanagement.expense.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * Domain entity representing a file attachment linked to an expense.
 * Supports receipt images, PDFs, and other supporting documents.
 */
@Entity
@Table(name = "expense_attachments", indexes = [
    Index(name = "idx_expense_attachments_expense", columnList = "expense_id"),
    Index(name = "idx_expense_attachments_attachment", columnList = "attachment_id"),
    Index(name = "idx_expense_attachments_linked_at", columnList = "linked_at")
])
@IdClass(ExpenseAttachmentId::class)
class ExpenseAttachment(
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    var expense: Expense? = null,
    
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id", nullable = false)
    val attachment: Attachment,
    
    @Column(name = "linked_at", nullable = false)
    val linkedAt: Instant = Instant.now(),
    
    @Column(name = "linked_by", nullable = false)
    val linkedBy: UUID,
    
    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,
    
    @Column(name = "description", length = 255)
    var description: String? = null
) {
    init {
        require(displayOrder >= 0) { "Display order cannot be negative" }
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ExpenseAttachment) return false
        return expense?.id == other.expense?.id && attachment.id == other.attachment.id
    }
    
    override fun hashCode(): Int {
        return 31 * (expense?.id?.hashCode() ?: 0) + attachment.id.hashCode()
    }
    
    override fun toString(): String {
        return "ExpenseAttachment(expenseId=${expense?.id}, attachmentId=${attachment.id}, linkedAt=$linkedAt)"
    }
}

/**
 * Composite primary key for ExpenseAttachment.
 */
@Embeddable
data class ExpenseAttachmentId(
    val expense: UUID? = null,
    val attachment: UUID? = null
) : java.io.Serializable