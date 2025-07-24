package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.domain.audit.*
import dev.ryuzu.astermanagement.dto.audit.*
import dev.ryuzu.astermanagement.service.LegacyAuditLogService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.*

/**
 * REST controller for audit trail and compliance reporting
 * Provides comprehensive audit log access with role-based security
 */
@RestController
@RequestMapping("/v1/audit")
@Tag(name = "Audit", description = "Audit trail and compliance reporting API")
@SecurityRequirement(name = "bearerAuth")
class AuditController(
    private val auditLogService: LegacyAuditLogService
) : BaseController() {
    
    /**
     * Get audit trail for a specific entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @Operation(
        summary = "Get entity audit trail",
        description = "Retrieves complete audit trail for a specific entity with optional event type filtering"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Audit trail retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Entity not found")
    )
    @PreAuthorize("hasAuthority('audit:read') or hasAuthority('matter:read')")
    fun getEntityAuditTrail(
        @Parameter(description = "Entity type (e.g., Matter, Document, User)")
        @PathVariable entityType: String,
        
        @Parameter(description = "Entity ID")
        @PathVariable entityId: String,
        
        @Parameter(description = "Optional event types to filter by")
        @RequestParam(required = false) eventTypes: List<AuditEventType>?,
        
        @PageableDefault(size = 50, sort = ["eventTimestamp"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): ResponseEntity<Page<AuditLogDto>> {
        val auditTrail = auditLogService.getEntityAuditTrail(
            entityType = entityType,
            entityId = entityId,
            eventTypes = eventTypes ?: emptyList(),
            pageable = pageable
        )
        
        return ResponseEntity.ok(auditTrail.map { it.toDto() })
    }
    
    /**
     * Get user activity log
     */
    @GetMapping("/user/{userId}")
    @Operation(
        summary = "Get user activity log",
        description = "Retrieves audit log of all activities performed by a specific user within a time range"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "User activity log retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:read') or (authentication.name == #userId and hasAuthority('user:read_own'))")
    fun getUserActivityLog(
        @Parameter(description = "User ID")
        @PathVariable userId: String,
        
        @Parameter(description = "Start time (ISO 8601)")
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        startTime: OffsetDateTime,
        
        @Parameter(description = "End time (ISO 8601)")
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        endTime: OffsetDateTime,
        
        @PageableDefault(size = 100, sort = ["eventTimestamp"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): ResponseEntity<Page<AuditLogDto>> {
        val activityLog = auditLogService.getUserActivityLog(userId, startTime, endTime, pageable)
        return ResponseEntity.ok(activityLog.map { it.toDto() })
    }
    
    /**
     * Get security events for monitoring
     */
    @GetMapping("/security")
    @Operation(
        summary = "Get security events",
        description = "Retrieves security-related audit events for monitoring and threat analysis"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Security events retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:security') or hasAuthority('admin')")
    fun getSecurityEvents(
        @Parameter(description = "Start time (ISO 8601)")
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        startTime: OffsetDateTime,
        
        @Parameter(description = "End time (ISO 8601)")
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        endTime: OffsetDateTime,
        
        @PageableDefault(size = 100, sort = ["eventTimestamp"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): ResponseEntity<Page<AuditLogDto>> {
        val securityEvents = auditLogService.getSecurityEvents(startTime, endTime, pageable)
        return ResponseEntity.ok(securityEvents.map { it.toDto() })
    }
    
    /**
     * Get correlated audit logs
     */
    @GetMapping("/correlation/{correlationId}")
    @Operation(
        summary = "Get correlated audit logs",
        description = "Retrieves all audit logs with the same correlation ID for tracking related operations"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Correlated audit logs retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:read')")
    fun getCorrelatedAuditLogs(
        @Parameter(description = "Correlation ID")
        @PathVariable correlationId: String
    ): ResponseEntity<List<AuditLogDto>> {
        val correlatedLogs = auditLogService.getCorrelatedAuditLogs(correlationId)
        return ResponseEntity.ok(correlatedLogs.map { it.toDto() })
    }
    
    /**
     * Search audit logs by event details
     */
    @PostMapping("/search")
    @Operation(
        summary = "Search audit logs",
        description = "Search audit logs using flexible criteria and JSON path queries"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Search results retrieved successfully"),
        ApiResponse(responseCode = "400", description = "Invalid search criteria"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:read')")
    fun searchAuditLogs(
        @Parameter(description = "Search criteria")
        @RequestBody searchRequest: AuditSearchRequest
    ): ResponseEntity<List<AuditLogDto>> {
        val results = auditLogService.searchByEventDetails(
            jsonQuery = searchRequest.jsonQuery,
            since = searchRequest.since ?: OffsetDateTime.now().minusDays(30)
        )
        return ResponseEntity.ok(results.map { it.toDto() })
    }
    
    /**
     * Get audit statistics
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Get audit statistics",
        description = "Retrieves audit statistics for monitoring dashboards and reporting"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Audit statistics retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:read') or hasAuthority('admin')")
    fun getAuditStatistics(
        @Parameter(description = "Start time for statistics (ISO 8601)")
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        since: OffsetDateTime?
    ): ResponseEntity<AuditStatisticsDto> {
        val statistics = auditLogService.getAuditStatistics(
            since ?: OffsetDateTime.now().minusHours(24)
        )
        return ResponseEntity.ok(statistics.toDto())
    }
    
    /**
     * Get suspicious activity
     */
    @GetMapping("/security/suspicious")
    @Operation(
        summary = "Get suspicious activity",
        description = "Identifies and retrieves suspicious activity patterns for security analysis"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Suspicious activity data retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:security') or hasAuthority('admin')")
    fun getSuspiciousActivity(
        @Parameter(description = "Lookback period in hours")
        @RequestParam(defaultValue = "6") hours: Int,
        
        @Parameter(description = "Minimum threshold for suspicious activity")
        @RequestParam(defaultValue = "10") threshold: Int
    ): ResponseEntity<List<AuditLogDto>> {
        val since = OffsetDateTime.now().minusHours(hours.toLong())
        val suspiciousLogs = auditLogService.findSuspiciousActivity(since, threshold)
        return ResponseEntity.ok(suspiciousLogs.map { it.toDto() })
    }
    
    /**
     * Get audit logs on legal hold
     */
    @GetMapping("/legal-hold")
    @Operation(
        summary = "Get audit logs on legal hold",
        description = "Retrieves all audit logs that are currently on legal hold"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Legal hold audit logs retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:legal') or hasAuthority('admin')")
    fun getAuditLogsOnLegalHold(
        @PageableDefault(size = 100, sort = ["eventTimestamp"], direction = Sort.Direction.DESC)
        pageable: Pageable
    ): ResponseEntity<Page<AuditLogDto>> {
        val legalHoldLogs = auditLogService.getAuditLogsOnLegalHold(pageable)
        return ResponseEntity.ok(legalHoldLogs.map { it.toDto() })
    }
    
    /**
     * Place audit logs on legal hold
     */
    @PostMapping("/legal-hold")
    @Operation(
        summary = "Place audit logs on legal hold",
        description = "Places specified audit logs on legal hold to prevent deletion"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Legal hold applied successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:legal') or hasAuthority('admin')")
    fun placeLegalHold(
        @Parameter(description = "Legal hold request")
        @RequestBody request: LegalHoldRequest
    ): ResponseEntity<LegalHoldResponse> {
        val updatedCount = auditLogService.placeLegalHold(request.auditLogIds, request.reason)
        return ResponseEntity.ok(
            LegalHoldResponse(
                success = true,
                updatedCount = updatedCount,
                message = "Legal hold applied to $updatedCount audit logs"
            )
        )
    }
    
    /**
     * Generate compliance report
     */
    @PostMapping("/compliance/report")
    @Operation(
        summary = "Generate compliance report",
        description = "Generates a comprehensive compliance report for specified date range and entity types"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Compliance report generated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid date range or parameters"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:compliance') or hasAuthority('admin')")
    fun generateComplianceReport(
        @Parameter(description = "Compliance report request")
        @RequestBody request: ComplianceReportRequest
    ): ResponseEntity<ComplianceReportDto> {
        val report = auditLogService.generateComplianceReport(
            startDate = request.startDate,
            endDate = request.endDate,
            entityTypes = request.entityTypes
        )
        return ResponseEntity.ok(report.toDto())
    }
    
    /**
     * Get current audit configuration
     */
    @GetMapping("/configuration")
    @Operation(
        summary = "Get audit configuration",
        description = "Retrieves current audit system configuration settings"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Audit configuration retrieved successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:config') or hasAuthority('admin')")
    fun getAuditConfiguration(): ResponseEntity<AuditConfigurationDto> {
        val configuration = auditLogService.getCurrentAuditConfiguration()
        return ResponseEntity.ok(configuration.toDto())
    }
    
    /**
     * Update audit configuration
     */
    @PutMapping("/configuration")
    @Operation(
        summary = "Update audit configuration",
        description = "Updates audit system configuration settings"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Audit configuration updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid configuration"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:config') or hasAuthority('admin')")
    fun updateAuditConfiguration(
        @Parameter(description = "Updated audit configuration")
        @RequestBody configurationDto: AuditConfigurationDto
    ): ResponseEntity<AuditConfigurationDto> {
        val configuration = configurationDto.toEntity()
        val updatedConfiguration = auditLogService.updateAuditConfiguration(configuration)
        return ResponseEntity.ok(updatedConfiguration.toDto())
    }
    
    /**
     * Perform manual audit cleanup
     */
    @PostMapping("/cleanup")
    @Operation(
        summary = "Perform manual audit cleanup",
        description = "Performs manual cleanup of old audit logs with optional dry-run mode"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Cleanup completed successfully"),
        ApiResponse(responseCode = "400", description = "Invalid cleanup parameters"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PreAuthorize("hasAuthority('audit:admin') or hasAuthority('admin')")
    fun performManualCleanup(
        @Parameter(description = "Cleanup request")
        @RequestBody request: CleanupRequest
    ): ResponseEntity<CleanupResultDto> {
        val result = auditLogService.performManualCleanup(
            cutoffDate = request.cutoffDate,
            dryRun = request.dryRun
        )
        return ResponseEntity.ok(result.toDto())
    }
}