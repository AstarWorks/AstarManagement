package com.astarworks.astarmanagement.expense.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import java.time.Instant
import java.util.UUID

/**
 * Embeddable audit information for tracking entity lifecycle.
 * Includes creation and update metadata following legal compliance requirements.
 */
@Embeddable
data class AuditInfo(
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
    
    @Column(name = "created_by", nullable = false, updatable = false)
    val createdBy: UUID? = null,
    
    @Column(name = "updated_by", nullable = false)
    var updatedBy: UUID? = null,
    
    @Column(name = "deleted_at")
    var deletedAt: Instant? = null,
    
    @Column(name = "deleted_by")
    var deletedBy: UUID? = null
) {
    /**
     * Marks the entity as deleted with soft delete support.
     * @param userId The ID of the user performing the deletion
     */
    fun markDeleted(userId: UUID) {
        deletedAt = Instant.now()
        deletedBy = userId
        updatedAt = Instant.now()
        updatedBy = userId
    }
    
    /**
     * Updates the modification tracking fields.
     * @param userId The ID of the user performing the update
     */
    fun markUpdated(userId: UUID) {
        updatedAt = Instant.now()
        updatedBy = userId
    }
    
    /**
     * Checks if the entity has been soft deleted.
     * @return true if the entity is deleted, false otherwise
     */
    fun isDeleted(): Boolean = deletedAt != null
    
    /**
     * Restores a soft-deleted entity.
     * @param userId The ID of the user performing the restoration
     */
    fun restore(userId: UUID) {
        deletedAt = null
        deletedBy = null
        updatedAt = Instant.now()
        updatedBy = userId
    }
}