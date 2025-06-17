package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.domain.audit.MatterAuditLog
import dev.ryuzu.astermanagement.dto.audit.MatterAuditLogDto
import dev.ryuzu.astermanagement.dto.audit.toDto
import dev.ryuzu.astermanagement.service.AuditLogService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.OffsetDateTime
import java.util.*

/**
 * REST controller for matter-specific audit operations
 * Provides detailed field-level audit trail for legal matters
 */
@RestController
@RequestMapping("/v1/matters/{matterId}/audit")
@Tag(name = "Matter Audit", description = "Matter-specific audit trail and field-level change tracking")
@SecurityRequirement(name = "bearerAuth")
class MatterAuditController(
    private val auditLogService: AuditLogService
) : BaseController() {
    
    /**
     * Get complete audit trail for a matter
     */
    @GetMapping
    @Operation(
        summary = "Get matter audit trail",
        description = "Retrieves complete audit trail for a specific matter with field-level change tracking"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Matter audit trail retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    @PreAuthorize("hasAuthority('matter:read') or @matterSecurityService.canUserAccessMatter(#matterId, authentication.name)")
    fun getMatterAuditTrail(
        @Parameter(description = "Matter ID")
        @PathVariable matterId: UUID,
        
        @PageableDefault(size = 50, sort = ["changedAt"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): ResponseEntity<Page<MatterAuditLogDto>> {
        val auditTrail = auditLogService.getMatterAuditTrail(matterId, pageable)
        return ResponseEntity.ok(auditTrail.map { it.toDto() })
    }
    
    /**
     * Get field history for a specific matter field
     */
    @GetMapping("/field/{fieldName}")
    @Operation(
        summary = "Get field history",
        description = "Retrieves complete change history for a specific field of a matter"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Field history retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter or field not found")
    )
    @PreAuthorize("hasAuthority('matter:read') or @matterSecurityService.canUserAccessMatter(#matterId, authentication.name)")
    fun getMatterFieldHistory(
        @Parameter(description = "Matter ID")
        @PathVariable matterId: UUID,
        
        @Parameter(description = "Field name (e.g., title, status, clientName)")
        @PathVariable fieldName: String
    ): ResponseEntity<List<MatterAuditLogDto>> {
        val fieldHistory = auditLogService.getMatterFieldHistory(matterId, fieldName)
        return ResponseEntity.ok(fieldHistory.map { it.toDto() })
    }
    
    /**
     * Get status change history for a matter
     */
    @GetMapping("/status-history")
    @Operation(
        summary = "Get status change history",
        description = "Retrieves chronological status change history for a matter"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Status history retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    @PreAuthorize("hasAuthority('matter:read') or @matterSecurityService.canUserAccessMatter(#matterId, authentication.name)")
    fun getMatterStatusHistory(
        @Parameter(description = "Matter ID")
        @PathVariable matterId: UUID
    ): ResponseEntity<List<MatterAuditLogDto>> {
        val statusHistory = auditLogService.getMatterStatusHistory(matterId)
        return ResponseEntity.ok(statusHistory.map { it.toDto() })
    }
    
    /**
     * Get comprehensive matter audit trail (combines general and field-level audits)
     */
    @GetMapping("/comprehensive")
    @Operation(
        summary = "Get comprehensive audit trail",
        description = "Retrieves both general audit events and field-level changes for a complete view"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Comprehensive audit trail retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    @PreAuthorize("hasAuthority('matter:read') or @matterSecurityService.canUserAccessMatter(#matterId, authentication.name)")
    fun getComprehensiveMatterAuditTrail(
        @Parameter(description = "Matter ID")
        @PathVariable matterId: UUID,
        
        @PageableDefault(size = 50, sort = ["eventTimestamp"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): ResponseEntity<ComprehensiveMatterAuditDto> {
        // Get general audit trail
        val generalAuditTrail = auditLogService.getEntityAuditTrail(
            entityType = "Matter",
            entityId = matterId.toString(),
            pageable = pageable
        )
        
        // Get field-level audit trail
        val fieldAuditTrail = auditLogService.getMatterAuditTrail(matterId, pageable)
        
        val comprehensiveAudit = ComprehensiveMatterAuditDto(
            matterId = matterId,
            generalAuditTrail = generalAuditTrail.map { it.toDto() },
            fieldAuditTrail = fieldAuditTrail.map { it.toDto() },
            totalGeneralEvents = generalAuditTrail.totalElements,
            totalFieldEvents = fieldAuditTrail.totalElements
        )
        
        return ResponseEntity.ok(comprehensiveAudit)
    }
    
    /**
     * Export matter audit trail for compliance
     */
    @GetMapping("/export")
    @Operation(
        summary = "Export matter audit trail",
        description = "Exports complete matter audit trail in a format suitable for legal compliance"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Audit trail exported successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    @PreAuthorize("hasAuthority('audit:export') or (hasAuthority('matter:read') and @matterSecurityService.canUserAccessMatter(#matterId, authentication.name))")
    fun exportMatterAuditTrail(
        @Parameter(description = "Matter ID")
        @PathVariable matterId: UUID,
        
        @Parameter(description = "Export format (JSON, CSV, PDF)")
        @RequestParam(defaultValue = "JSON") format: String
    ): ResponseEntity<MatterAuditExportDto> {
        // Get complete audit trail for export
        val generalAuditTrail = auditLogService.getEntityAuditTrail(
            entityType = "Matter",
            entityId = matterId.toString(),
            pageable = Pageable.unpaged()
        )
        
        val fieldAuditTrail = auditLogService.getMatterAuditTrail(
            matterId = matterId,
            pageable = Pageable.unpaged()
        )
        
        val exportData = MatterAuditExportDto(
            matterId = matterId,
            exportFormat = format,
            exportedAt = java.time.OffsetDateTime.now(),
            exportedBy = try { getCurrentUserId().toString() } catch (e: Exception) { "system" },
            generalEvents = generalAuditTrail.content.map { it.toDto() },
            fieldEvents = fieldAuditTrail.content.map { it.toDto() },
            totalEvents = generalAuditTrail.totalElements + fieldAuditTrail.totalElements,
            metadata = mapOf(
                "exportReason" to "Compliance export",
                "exportVersion" to "1.0",
                "includesFieldLevel" to true,
                "includesGeneralEvents" to true
            )
        )
        
        return ResponseEntity.ok(exportData)
    }
}

/**
 * DTO for matter-specific audit log
 */
data class MatterAuditLogDto(
    val id: UUID?,
    val matterId: UUID,
    val operation: String,
    val fieldName: String,
    val oldValue: String?,
    val newValue: String?,
    val changedBy: UUID,
    val changedAt: java.time.OffsetDateTime,
    val ipAddress: String?,
    val userAgent: String?,
    val sessionId: String?,
    val changeReason: String?,
    val createdAt: java.time.OffsetDateTime
)


/**
 * DTO for comprehensive matter audit trail
 */
data class ComprehensiveMatterAuditDto(
    val matterId: UUID,
    val generalAuditTrail: Page<dev.ryuzu.astermanagement.dto.audit.AuditLogDto>,
    val fieldAuditTrail: Page<MatterAuditLogDto>,
    val totalGeneralEvents: Long,
    val totalFieldEvents: Long,
    val summary: MatterAuditSummaryDto = MatterAuditSummaryDto(
        totalEvents = totalGeneralEvents + totalFieldEvents,
        lastActivity = generalAuditTrail.content.maxByOrNull { it.eventTimestamp }?.eventTimestamp,
        mostActiveFields = emptyList(), // Would be calculated from actual data
        statusChanges = 0 // Would be calculated from actual data
    )
)

/**
 * DTO for matter audit summary
 */
data class MatterAuditSummaryDto(
    val totalEvents: Long,
    val lastActivity: java.time.OffsetDateTime?,
    val mostActiveFields: List<String>,
    val statusChanges: Int
)

/**
 * DTO for matter audit export
 */
data class MatterAuditExportDto(
    val matterId: UUID,
    val exportFormat: String,
    val exportedAt: java.time.OffsetDateTime,
    val exportedBy: String,
    val generalEvents: List<dev.ryuzu.astermanagement.dto.audit.AuditLogDto>,
    val fieldEvents: List<MatterAuditLogDto>,
    val totalEvents: Long,
    val metadata: Map<String, Any>
)