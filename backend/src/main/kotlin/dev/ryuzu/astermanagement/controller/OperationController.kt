package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.domain.operation.OperationType
import dev.ryuzu.astermanagement.domain.operation.OperationStatus
import dev.ryuzu.astermanagement.dto.common.PagedResponse
import dev.ryuzu.astermanagement.dto.operation.*
import dev.ryuzu.astermanagement.service.OperationService
import dev.ryuzu.astermanagement.service.UserOperationLimits
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime
import java.util.*

/**
 * REST controller for bulk operations and background task management.
 * Provides endpoints for creating, monitoring, and controlling operations.
 */
@RestController
@RequestMapping("/api/v1/operations")
@Validated
@Tag(name = "Operation Management", description = "Endpoints for managing bulk operations and background tasks")
@SecurityRequirement(name = "bearerAuth")
class OperationController(
    private val operationService: OperationService
) : BaseController() {
    
    /**
     * Create a new operation
     */
    @PostMapping
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Create new operation",
        description = "Creates a new background operation. The operation will be queued and processed asynchronously."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Operation created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "429", description = "Operation limit exceeded")
    )
    fun createOperation(
        @Valid @RequestBody request: CreateOperationRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<OperationDto> {
        val userId = getCurrentUserId()
        val operation = operationService.createOperation(request, userId)
        val dto = operation.toDto()
        return created(dto, operation.id.toString())
    }
    
    /**
     * Get operation by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK') or @operationSecurityService.canUserAccessOperation(#id, authentication.name)")
    @Operation(
        summary = "Get operation by ID",
        description = "Retrieves a specific operation by its ID. Users can only access their own operations unless they have admin privileges."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Operation found"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Operation not found")
    )
    fun getOperationById(
        @PathVariable @Parameter(description = "Operation ID") id: UUID
    ): ResponseEntity<OperationDto> {
        val operation = operationService.getOperationById(id)
        return operation?.let { ok(it.toDto()) } ?: notFound()
    }
    
    /**
     * Get user's operations with pagination
     */
    @GetMapping
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "List user operations",
        description = "Retrieves a paginated list of operations for the current user with optional filtering."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun getUserOperations(
        @RequestParam(defaultValue = "0") @Parameter(description = "Page number (0-based)") page: Int,
        @RequestParam(defaultValue = "20") @Parameter(description = "Page size (1-100)") size: Int,
        @RequestParam(defaultValue = "queuedAt,desc") @Parameter(description = "Sort criteria") sort: String,
        @RequestParam(required = false) @Parameter(description = "Filter by status") status: OperationStatus?
    ): ResponseEntity<PagedResponse<OperationDto>> {
        val (validatedPage, validatedSize) = validatePagination(page, size)
        val sortParams = parseSortParams(sort)
        val pageable = PageRequest.of(validatedPage, validatedSize, sortParams)
        
        val userId = getCurrentUserId()
        val operations = operationService.getOperationsByUser(userId, pageable, status)
        val response = PagedResponse.fromPage(operations) { it.toDto() }
        
        return ok(response)
    }
    
    /**
     * Get all operations (admin only)
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "List all operations (admin)",
        description = "Retrieves a paginated list of all operations. Admin access required."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Admin access required")
    )
    fun getAllOperations(
        @RequestParam(defaultValue = "0") @Parameter(description = "Page number (0-based)") page: Int,
        @RequestParam(defaultValue = "20") @Parameter(description = "Page size (1-100)") size: Int,
        @RequestParam(defaultValue = "queuedAt,desc") @Parameter(description = "Sort criteria") sort: String,
        @RequestParam(required = false) @Parameter(description = "Filter by status") status: OperationStatus?,
        @RequestParam(required = false) @Parameter(description = "Filter by type") type: OperationType?
    ): ResponseEntity<PagedResponse<OperationDto>> {
        val (validatedPage, validatedSize) = validatePagination(page, size)
        val sortParams = parseSortParams(sort)
        val pageable = PageRequest.of(validatedPage, validatedSize, sortParams)
        
        val operations = operationService.getAllOperations(pageable, status, type)
        val response = PagedResponse.fromPage(operations) { it.toDto() }
        
        return ok(response)
    }
    
    /**
     * Cancel an operation
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK') or @operationSecurityService.canUserControlOperation(#id, authentication.name)")
    @Operation(
        summary = "Cancel operation",
        description = "Cancels a queued or running operation. Only the operation owner or authorized users can cancel operations."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Operation cancelled successfully"),
        ApiResponse(responseCode = "400", description = "Operation cannot be cancelled"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Operation not found")
    )
    fun cancelOperation(
        @PathVariable @Parameter(description = "Operation ID") id: UUID,
        @Valid @RequestBody(required = false) request: CancelOperationRequest?
    ): ResponseEntity<OperationDto> {
        val success = operationService.cancelOperation(id, request?.reason)
        return if (success) {
            val operation = operationService.getOperationById(id)
            operation?.let { ok(it.toDto()) } ?: notFound()
        } else {
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Pause an operation
     */
    @PostMapping("/{id}/pause")
    @PreAuthorize("hasRole('LAWYER') or @operationSecurityService.canUserControlOperation(#id, authentication.name)")
    @Operation(
        summary = "Pause operation",
        description = "Pauses a running operation. Only lawyers or operation owners can pause operations."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Operation paused successfully"),
        ApiResponse(responseCode = "400", description = "Operation cannot be paused"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Operation not found")
    )
    fun pauseOperation(
        @PathVariable @Parameter(description = "Operation ID") id: UUID,
        @Valid @RequestBody(required = false) request: PauseResumeOperationRequest?
    ): ResponseEntity<OperationDto> {
        val success = operationService.pauseOperation(id, request?.reason)
        return if (success) {
            val operation = operationService.getOperationById(id)
            operation?.let { ok(it.toDto()) } ?: notFound()
        } else {
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Resume a paused operation
     */
    @PostMapping("/{id}/resume")
    @PreAuthorize("hasRole('LAWYER') or @operationSecurityService.canUserControlOperation(#id, authentication.name)")
    @Operation(
        summary = "Resume operation",
        description = "Resumes a paused operation. Only lawyers or operation owners can resume operations."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Operation resumed successfully"),
        ApiResponse(responseCode = "400", description = "Operation cannot be resumed"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Operation not found")
    )
    fun resumeOperation(
        @PathVariable @Parameter(description = "Operation ID") id: UUID,
        @Valid @RequestBody(required = false) request: PauseResumeOperationRequest?
    ): ResponseEntity<OperationDto> {
        val success = operationService.resumeOperation(id, request?.reason)
        return if (success) {
            val operation = operationService.getOperationById(id)
            operation?.let { ok(it.toDto()) } ?: notFound()
        } else {
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Retry a failed operation
     */
    @PostMapping("/{id}/retry")
    @PreAuthorize("hasRole('LAWYER') or @operationSecurityService.canUserControlOperation(#id, authentication.name)")
    @Operation(
        summary = "Retry operation",
        description = "Retries a failed operation. The operation will be queued again for processing."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Operation queued for retry"),
        ApiResponse(responseCode = "400", description = "Operation cannot be retried"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Operation not found")
    )
    fun retryOperation(
        @PathVariable @Parameter(description = "Operation ID") id: UUID,
        @Valid @RequestBody(required = false) request: RetryOperationRequest?
    ): ResponseEntity<OperationDto> {
        val success = operationService.retryOperation(id, request?.resetRetryCount ?: false)
        return if (success) {
            val operation = operationService.getOperationById(id)
            operation?.let { ok(it.toDto()) } ?: notFound()
        } else {
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Get operation queue status
     */
    @GetMapping("/queue/status")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Get queue status",
        description = "Retrieves the current status of the operation queue including running and queued operations."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Queue status retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun getQueueStatus(): ResponseEntity<OperationQueueStatus> {
        val status = operationService.getQueueStatus()
        return ok(status)
    }
    
    /**
     * Get operation statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('LAWYER')")
    @Operation(
        summary = "Get operation statistics",
        description = "Retrieves statistical information about operations for a given time period."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Lawyer access required")
    )
    fun getOperationStatistics(
        @RequestParam(required = false) @Parameter(description = "Start date (ISO format)") startDate: LocalDateTime?,
        @RequestParam(required = false) @Parameter(description = "End date (ISO format)") endDate: LocalDateTime?
    ): ResponseEntity<OperationStatistics> {
        val start = startDate ?: LocalDateTime.now().minusDays(30)
        val end = endDate ?: LocalDateTime.now()
        
        val statistics = operationService.getOperationStatistics(start, end)
        return ok(statistics)
    }
    
    /**
     * Bulk update matters
     */
    @PostMapping("/bulk-update-matters")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Bulk update matters",
        description = "Creates a bulk update operation for multiple matters. The operation will be processed asynchronously."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Bulk update operation created"),
        ApiResponse(responseCode = "400", description = "Invalid request data or validation errors"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "422", description = "Validation errors in matter data")
    )
    fun bulkUpdateMatters(
        @Valid @RequestBody request: BulkUpdateMatterRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<OperationDto> {
        val userId = getCurrentUserId()
        val operation = operationService.bulkUpdateMatters(request, userId)
        val dto = operation.toDto()
        return created(dto, operation.id.toString())
    }
    
    /**
     * Bulk delete matters
     */
    @PostMapping("/bulk-delete-matters")
    @PreAuthorize("hasRole('LAWYER')")
    @Operation(
        summary = "Bulk delete matters",
        description = "Creates a bulk delete operation for multiple matters. Only lawyers can perform bulk deletions."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Bulk delete operation created"),
        ApiResponse(responseCode = "400", description = "Invalid request data or validation errors"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Lawyer access required"),
        ApiResponse(responseCode = "422", description = "Validation errors in matter data")
    )
    fun bulkDeleteMatters(
        @Valid @RequestBody request: BulkDeleteMatterRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<OperationDto> {
        val userId = getCurrentUserId()
        val operation = operationService.bulkDeleteMatters(request, userId)
        val dto = operation.toDto()
        return created(dto, operation.id.toString())
    }
    
    /**
     * Export matters
     */
    @PostMapping("/export-matters")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Export matters",
        description = "Creates an export operation for matters in various formats (CSV, Excel, PDF, JSON)."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Export operation created"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun exportMatters(
        @Valid @RequestBody request: ExportMatterRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<OperationDto> {
        val userId = getCurrentUserId()
        val operation = operationService.exportMatters(request, userId)
        val dto = operation.toDto()
        return created(dto, operation.id.toString())
    }
    
    /**
     * Validate bulk update request
     */
    @PostMapping("/validate-bulk-update")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Validate bulk update",
        description = "Validates a bulk update request without executing it. Returns validation results and errors."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Validation completed"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun validateBulkUpdate(
        @Valid @RequestBody request: BulkUpdateMatterRequest
    ): ResponseEntity<BatchValidationResult> {
        val validation = operationService.validateBulkUpdate(request)
        return ok(validation)
    }
    
    /**
     * Validate bulk delete request
     */
    @PostMapping("/validate-bulk-delete")
    @PreAuthorize("hasRole('LAWYER')")
    @Operation(
        summary = "Validate bulk delete",
        description = "Validates a bulk delete request without executing it. Returns validation results and errors."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Validation completed"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Lawyer access required")
    )
    fun validateBulkDelete(
        @Valid @RequestBody request: BulkDeleteMatterRequest
    ): ResponseEntity<BatchValidationResult> {
        val validation = operationService.validateBulkDelete(request)
        return ok(validation)
    }
    
    /**
     * Get user operation limits
     */
    @GetMapping("/limits")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Get user operation limits",
        description = "Retrieves the current user's operation limits and usage statistics."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Limits retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun getUserOperationLimits(): ResponseEntity<UserOperationLimits> {
        val userId = getCurrentUserId()
        val limits = operationService.getUserOperationLimits(userId)
        return ok(limits)
    }
    
    // Private helper methods
    
    /**
     * Parses sort parameters from string format.
     */
    private fun parseSortParams(sort: String): Sort {
        val parts = sort.split(",")
        return when (parts.size) {
            1 -> Sort.by(parts[0])
            2 -> {
                val direction = if (parts[1].equals("desc", ignoreCase = true)) {
                    Sort.Direction.DESC
                } else {
                    Sort.Direction.ASC
                }
                Sort.by(direction, parts[0])
            }
            else -> Sort.by("queuedAt").descending()
        }
    }
    
    /**
     * Extension function to convert Operation entity to DTO.
     */
    private fun dev.ryuzu.astermanagement.domain.operation.Operation.toDto(): OperationDto {
        return OperationDto(
            id = this.id!!,
            type = this.operationType,
            priority = this.priority,
            status = this.status,
            title = this.title,
            description = this.description,
            payload = this.payload,
            result = this.result,
            errorMessage = this.errorMessage,
            progressCurrent = this.progressCurrent,
            progressTotal = this.progressTotal,
            progressMessage = this.progressMessage,
            progressPercentage = this.progressPercentage,
            queuedAt = this.queuedAt,
            startedAt = this.startedAt,
            completedAt = this.completedAt,
            retryCount = this.retryCount,
            maxRetries = this.maxRetries,
            estimatedDurationSeconds = this.estimatedDurationSeconds,
            actualDurationSeconds = this.durationSeconds,
            dependencies = this.dependencies.toList(),
            transactionId = this.transactionId,
            userId = this.user?.id!!,
            userEmail = this.user?.email,
            canRetry = this.canRetry,
            canCancel = this.canCancel,
            isTerminal = this.isTerminal,
            createdAt = this.createdAt ?: throw IllegalStateException("Created at cannot be null"),
            updatedAt = this.updatedAt ?: throw IllegalStateException("Updated at cannot be null")
        )
    }
}