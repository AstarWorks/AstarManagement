package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.Matter
import dev.ryuzu.astermanagement.domain.MatterStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

/**
 * Service interface for matter management operations.
 * Defines business logic for handling matters.
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
    fun getMatterById(id: Long): Matter?
    
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
    fun updateMatter(id: Long, matter: Matter): Matter?
    
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
        id: Long,
        newStatus: MatterStatus,
        comment: String? = null,
        userId: Long
    ): Matter?
    
    /**
     * Soft deletes a matter by setting its status to DELETED.
     * 
     * @param id The matter ID to delete
     * @return true if deleted, false if not found
     */
    fun deleteMatter(id: Long): Boolean
    
    /**
     * Checks if a case number already exists.
     * 
     * @param caseNumber The case number to check
     * @return true if exists, false otherwise
     */
    fun existsByCaseNumber(caseNumber: String): Boolean
}