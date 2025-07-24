package dev.ryuzu.astermanagement.modules.matter.api

import dev.ryuzu.astermanagement.modules.matter.api.dto.MatterDTO
import dev.ryuzu.astermanagement.modules.matter.api.dto.CreateMatterRequest
import dev.ryuzu.astermanagement.modules.matter.api.dto.UpdateMatterRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

/**
 * Public API for Matter module
 * Defines all operations available to other modules and controllers
 */
interface MatterService {
    
    /**
     * Create a new matter
     */
    fun createMatter(request: CreateMatterRequest): MatterDTO
    
    /**
     * Get matter by ID
     */
    fun getMatterById(id: UUID): MatterDTO?
    
    /**
     * Get matter by case number
     */
    fun getMatterByCaseNumber(caseNumber: String): MatterDTO?
    
    /**
     * Update existing matter
     */
    fun updateMatter(id: UUID, request: UpdateMatterRequest): MatterDTO
    
    /**
     * Delete matter (soft delete)
     */
    fun deleteMatter(id: UUID)
    
    /**
     * Get matters assigned to a lawyer
     */
    fun getMattersByLawyer(lawyerId: UUID, pageable: Pageable): Page<MatterDTO>
    
    /**
     * Get matters for a client
     */
    fun getMattersByClient(clientId: UUID, pageable: Pageable): Page<MatterDTO>
    
    /**
     * Search matters by various criteria
     */
    fun searchMatters(
        query: String? = null,
        status: String? = null,
        priority: String? = null,
        assignedLawyerId: UUID? = null,
        clientId: UUID? = null,
        pageable: Pageable
    ): Page<MatterDTO>
    
    /**
     * Update matter status
     */
    fun updateMatterStatus(id: UUID, newStatus: String, userId: UUID): MatterDTO
    
    /**
     * Get matter statistics for dashboard
     */
    fun getMatterStatistics(lawyerId: UUID? = null): MatterStatistics
    
    /**
     * Check if user has access to matter
     */
    fun hasAccessToMatter(matterId: UUID, userId: UUID): Boolean
}

/**
 * Matter statistics data class
 */
data class MatterStatistics(
    val totalMatters: Long,
    val activeMatters: Long,
    val overdueMatters: Long,
    val completedThisMonth: Long,
    val averageCompletionDays: Double?
)