package com.astarworks.astarmanagement.expense.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * Domain entity representing a file attachment.
 * Manages file metadata, storage information, and lifecycle.
 */
@Entity
@Table(name = "attachments", indexes = [
    Index(name = "idx_attachments_status", columnList = "status, expires_at"),
    Index(name = "idx_attachments_tenant", columnList = "tenant_id"),
    Index(name = "idx_attachments_uploaded_by", columnList = "uploaded_by")
])
class Attachment(
    @Id
    @Column(name = "id", nullable = false)
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,
    
    @Column(name = "file_name", nullable = false, length = 255)
    val fileName: String,
    
    @Column(name = "original_name", nullable = false, length = 255)
    val originalName: String,
    
    @Column(name = "file_size", nullable = false)
    val fileSize: Long,
    
    @Column(name = "mime_type", nullable = false, length = 100)
    val mimeType: String,
    
    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    val storagePath: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: AttachmentStatus = AttachmentStatus.TEMPORARY,
    
    @Column(name = "linked_at")
    var linkedAt: Instant? = null,
    
    @Column(name = "expires_at")
    var expiresAt: Instant? = null,
    
    @Column(name = "thumbnail_path", columnDefinition = "TEXT")
    var thumbnailPath: String? = null,
    
    @Column(name = "thumbnail_size")
    var thumbnailSize: Long? = null,
    
    @Column(name = "uploaded_at", nullable = false)
    val uploadedAt: Instant = Instant.now(),
    
    @Column(name = "uploaded_by", nullable = false)
    val uploadedBy: UUID,
    
    @Column(name = "deleted_at")
    var deletedAt: Instant? = null,
    
    @Column(name = "deleted_by")
    var deletedBy: UUID? = null,
    
    @OneToMany(mappedBy = "attachment", cascade = [CascadeType.ALL], orphanRemoval = true)
    val expenseAttachments: MutableSet<ExpenseAttachment> = mutableSetOf()
) {
    init {
        require(fileName.isNotBlank()) { "File name cannot be blank" }
        require(originalName.isNotBlank()) { "Original name cannot be blank" }
        require(fileSize > 0) { "File size must be positive" }
        require(mimeType.isNotBlank()) { "MIME type cannot be blank" }
        require(storagePath.isNotBlank()) { "Storage path cannot be blank" }
    }
    
    /**
     * Marks the attachment as permanently linked.
     */
    fun markAsLinked() {
        status = AttachmentStatus.LINKED
        linkedAt = Instant.now()
        expiresAt = null
    }
    
    /**
     * Marks the attachment for deletion.
     * @param userId The user performing the deletion
     */
    fun markDeleted(userId: UUID) {
        deletedAt = Instant.now()
        deletedBy = userId
        status = AttachmentStatus.DELETED
    }
    
    /**
     * Checks if the attachment is an image.
     * @return true if the MIME type indicates an image
     */
    fun isImage(): Boolean {
        return mimeType.startsWith("image/")
    }
    
    /**
     * Checks if the attachment is a PDF.
     * @return true if the MIME type is PDF
     */
    fun isPdf(): Boolean {
        return mimeType == "application/pdf"
    }
    
    /**
     * Checks if the attachment has expired.
     * @return true if the attachment has an expiry date that has passed
     */
    fun isExpired(): Boolean {
        return expiresAt?.isBefore(Instant.now()) ?: false
    }
    
    /**
     * Gets the file extension from the file name.
     * @return The file extension or empty string if none
     */
    fun getFileExtension(): String {
        val lastDot = fileName.lastIndexOf('.')
        return if (lastDot >= 0) fileName.substring(lastDot + 1).lowercase() else ""
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Attachment) return false
        return id == other.id
    }
    
    override fun hashCode(): Int = id.hashCode()
    
    override fun toString(): String {
        return "Attachment(id=$id, fileName='$fileName', status=$status, fileSize=$fileSize)"
    }
}

/**
 * Enum representing the status of an attachment.
 */
enum class AttachmentStatus {
    /** Temporary upload, not yet linked to an expense */
    TEMPORARY,
    
    /** Successfully linked to one or more expenses */
    LINKED,
    
    /** Marked for deletion */
    DELETED,
    
    /** Upload failed */
    FAILED
}