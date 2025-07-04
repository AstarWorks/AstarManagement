package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

/**
 * Result of bulk matter operations
 */
data class BulkMatterOperationResult(
    val totalRequested: Int,
    val totalProcessed: Int,
    val totalSuccessful: Int,
    val totalFailed: Int,
    val totalSkipped: Int,
    val errors: List<MatterOperationError>,
    val warnings: List<String> = emptyList(),
    val updatedMatterIds: List<UUID> = emptyList(),
    val skippedMatterIds: List<UUID> = emptyList()
)

/**
 * Error details for matter operations
 */
data class MatterOperationError(
    val matterId: UUID,
    val errorCode: String,
    val errorMessage: String,
    val field: String? = null,
    val currentValue: Any? = null,
    val attemptedValue: Any? = null
)

/**
 * Validation error for matter updates
 */
data class MatterValidationError(
    val matterId: UUID,
    val field: String,
    val errorMessage: String,
    val currentValue: Any? = null,
    val attemptedValue: Any? = null,
    val violatedRule: String? = null
)

/**
 * Service interface for matter management operations.
 * Defines business logic for handling matters using the backend domain model.
 */
interface MatterService {
    
    /**
     * Creates a new matter.
     * 
     * @param matter The matter to create
     * @return The created matter with generated ID
     */
    fun createMatter(matter: Matter): Matter
    
    /**
     * Retrieves a matter by ID.
     * 
     * @param id The matter ID
     * @return The matter if found, null otherwise
     */
    fun getMatterById(id: UUID): Matter?
    
    /**
     * Retrieves all matters with pagination and optional filtering.
     * 
     * @param pageable Pagination parameters
     * @param status Optional status filter
     * @param clientName Optional client name filter (partial match)
     * @return Page of matters matching the criteria
     */
    fun getAllMatters(
        pageable: Pageable,
        status: MatterStatus? = null,
        clientName: String? = null
    ): Page<Matter>
    
    /**
     * Updates an existing matter.
     * 
     * @param id The matter ID to update
     * @param matter The updated matter data
     * @return The updated matter if found, null otherwise
     */
    fun updateMatter(id: UUID, matter: Matter): Matter?
    
    /**
     * Updates the status of a matter.
     * 
     * @param id The matter ID
     * @param newStatus The new status
     * @param comment Optional comment for the status change
     * @param userId The ID of the user making the change
     * @return The updated matter if found and transition is valid, null otherwise
     * @throws IllegalStateException if the status transition is not allowed
     */
    fun updateMatterStatus(
        id: UUID,
        newStatus: MatterStatus,
        comment: String? = null,
        userId: UUID
    ): Matter?
    
    /**
     * Soft deletes a matter by setting its status to CLOSED.
     * 
     * @param id The matter ID to delete
     * @return true if deleted, false if not found
     */
    fun deleteMatter(id: UUID): Boolean
    
    /**
     * Checks if a case number already exists.
     * 
     * @param caseNumber The case number to check
     * @return true if exists, false otherwise
     */
    fun existsByCaseNumber(caseNumber: String): Boolean
    
    /**
     * Assigns a lawyer to a matter
     * 
     * @param matterId The matter ID
     * @param lawyerId The lawyer ID to assign
     * @return The updated matter
     */
    fun assignLawyer(matterId: UUID, lawyerId: UUID): Matter?
    
    /**
     * Assigns a clerk to a matter
     * 
     * @param matterId The matter ID  
     * @param clerkId The clerk ID to assign
     * @return The updated matter
     */
    fun assignClerk(matterId: UUID, clerkId: UUID): Matter?
    
    /**
     * Bulk update matters with transaction support
     * 
     * @param matterIds List of matter IDs to update
     * @param updates Map of field updates to apply
     * @param validateTransitions Whether to validate status transitions
     * @param stopOnFirstError Whether to stop on first error or continue
     * @return Bulk operation result with success/failure details
     */
    fun bulkUpdateMatters(
        matterIds: List<UUID>,
        updates: Map<String, Any?>,
        validateTransitions: Boolean = true,
        stopOnFirstError: Boolean = false
    ): BulkMatterOperationResult
    
    /**
     * Bulk delete matters with transaction support
     * 
     * @param matterIds List of matter IDs to delete
     * @param reason Reason for deletion
     * @param forceDelete Whether to force delete non-closed matters
     * @return Bulk operation result with success/failure details
     */
    fun bulkDeleteMatters(
        matterIds: List<UUID>,
        reason: String,
        forceDelete: Boolean = false
    ): BulkMatterOperationResult
    
    /**
     * Validate bulk matter updates without executing them
     * 
     * @param matterIds List of matter IDs to validate
     * @param updates Map of field updates to validate
     * @return List of validation errors
     */
    fun validateBulkMatterUpdates(
        matterIds: List<UUID>,
        updates: Map<String, Any?>
    ): List<MatterValidationError>
}

/**
 * Type-safe matter update value
 */
sealed class MatterUpdateValue {
    data class StatusUpdate(val status: MatterStatus) : MatterUpdateValue()
    data class PriorityUpdate(val priority: dev.ryuzu.astermanagement.domain.matter.MatterPriority) : MatterUpdateValue()
    data class LawyerUpdate(val lawyerId: UUID?) : MatterUpdateValue()
    data class ClerkUpdate(val clerkId: UUID?) : MatterUpdateValue()
    data class NotesUpdate(val notes: String?) : MatterUpdateValue()
    data class AddTagsUpdate(val tags: List<String>) : MatterUpdateValue()
    data class RemoveTagsUpdate(val tags: List<String>) : MatterUpdateValue()
}

/**
 * Type-safe matter updates
 */
typealias MatterUpdates = Map<String, MatterUpdateValue>