package dev.ryuzu.astermanagement.modules.matter.infrastructure

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.modules.matter.api.MatterService
import dev.ryuzu.astermanagement.modules.matter.api.dto.*
import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus  
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.dto.common.PagedResponse
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
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.util.*

/**
 * REST controller for matter management operations.
 * Provides CRUD endpoints for managing legal matters.
 */
@RestController
@RequestMapping("/api/v1/matters")
@Validated
@Tag(name = "Matter Management", description = "Endpoints for managing legal matters")
@SecurityRequirement(name = "bearerAuth")
class MatterController(
    private val matterService: MatterService,
    private val userRepository: UserRepository
) : BaseController() {
    
    /* Search functionality temporarily disabled during Spring Modulith migration
    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'MATTER_READ')")
    fun searchMatters(...): ResponseEntity<PagedResponse<MatterSearchResultDto>> {
        // TODO: Implement search service
        return ResponseEntity.notImplemented().build()
    }

    @GetMapping("/search/suggestions")  
    @PreAuthorize("hasPermission(null, 'MATTER_READ')")
    fun getSearchSuggestions(...): ResponseEntity<List<SearchSuggestionDto>> {
        // TODO: Implement search suggestions
        return ResponseEntity.notImplemented().build()
    }
    */

    /**
     * Creates a new matter.
     */
    @PostMapping(
        consumes = [MediaType.APPLICATION_JSON_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @PreAuthorize("hasPermission(null, 'MATTER_CREATE')")
    @Operation(
        summary = "Create a new matter",
        description = "Creates a new legal matter. Requires LAWYER role."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Matter created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "409", description = "Case number already exists")
    )
    fun createMatter(
        @Valid @RequestBody request: CreateMatterRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<MatterDto> {
        val createdMatter = matterService.createMatter(request)
        return created(createdMatter.toMatterDto(), createdMatter.id.toString())
    }
    
    /**
     * Retrieves a matter by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_READ')")
    @Operation(
        summary = "Get matter by ID",
        description = "Retrieves a specific matter by its ID. Clients can only access their own matters."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Matter found"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    fun getMatterById(
        @PathVariable @Parameter(description = "Matter ID") id: UUID
    ): ResponseEntity<MatterDto> {
        val matter = matterService.getMatterById(id)
        return matter?.let { ok(it.toMatterDto()) } ?: notFound()
    }
    
    /**
     * Retrieves all matters with pagination and filtering.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'MATTER_READ')")
    @Operation(
        summary = "List all matters",
        description = "Retrieves a paginated list of matters with optional filtering. Requires LAWYER or CLERK role."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun getAllMatters(
        @RequestParam(defaultValue = "0") @Parameter(description = "Page number (0-based)") page: Int,
        @RequestParam(defaultValue = "20") @Parameter(description = "Page size (1-100)") size: Int,
        @RequestParam(defaultValue = "createdAt,desc") @Parameter(description = "Sort criteria") sort: String,
        @RequestParam(required = false) @Parameter(description = "Filter by status") status: String?,
        @RequestParam(required = false) @Parameter(description = "Filter by priority") priority: String?,
        @RequestParam(required = false) @Parameter(description = "Filter by client name (partial match)") clientName: String?,
        @RequestParam(required = false) @Parameter(description = "Filter by assigned lawyer") assignedLawyer: UUID?
    ): ResponseEntity<PagedResponse<MatterDto>> {
        val (validatedPage, validatedSize) = validatePagination(page, size)
        val sortParams = parseSortParams(sort)
        val pageable = PageRequest.of(validatedPage, validatedSize, sortParams)
        
        val matters = matterService.searchMatters(
            query = clientName,
            status = status,
            priority = priority,
            assignedLawyerId = assignedLawyer,
            clientId = null,
            pageable = pageable
        )
        val response = PagedResponse.fromPage(matters) { it.toMatterDto() }
        
        return ok(response)
    }
    
    /**
     * Updates an existing matter.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_UPDATE')")
    @Operation(
        summary = "Update matter",
        description = "Updates an existing matter. Lawyers can update any matter, clerks can only update assigned matters."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Matter updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    fun updateMatter(
        @PathVariable @Parameter(description = "Matter ID") id: UUID,
        @Valid @RequestBody request: UpdateMatterRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<MatterDto> {
        val result = matterService.updateMatter(id, request)
        return ok(result.toMatterDto())
    }
    
    /**
     * Updates the status of a matter.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_UPDATE')")
    @Operation(
        summary = "Update matter status",
        description = "Updates the status of a matter. Requires LAWYER role. Some transitions may require supervisor approval."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Status updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid status transition"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    fun updateMatterStatus(
        @PathVariable @Parameter(description = "Matter ID") id: UUID,
        @Valid @RequestBody request: UpdateMatterStatusRequest,
        @AuthenticationPrincipal user: UserDetails
    ): ResponseEntity<MatterDto> {
        return try {
            val userId = getCurrentUserId()
            val result = matterService.updateMatterStatus(id, request.status, userId)
            ok(result.toMatterDto())
        } catch (e: IllegalStateException) {
            // Invalid status transition
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Soft deletes a matter.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_DELETE')")
    @Operation(
        summary = "Delete matter",
        description = "Soft deletes a matter by setting its status to CLOSED. Requires LAWYER role."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Matter deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    fun deleteMatter(
        @PathVariable @Parameter(description = "Matter ID") id: UUID
    ): ResponseEntity<Void> {
        matterService.deleteMatter(id)
        return noContent()
    }
    
    
    /* Status transition validation temporarily disabled during Spring Modulith migration
    @PostMapping("/{id}/validate-transition")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_READ')")
    fun validateStatusTransition(...): ResponseEntity<ValidateTransitionResponse> {
        // TODO: Implement status transition validation
        return ResponseEntity.notImplemented().build()
    }
    */

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
            else -> Sort.by("createdAt").descending()
        }
    }
    
    /**
     * Extension function to convert MatterDTO to MatterDto for controller responses.
     */
    private fun MatterDTO.toMatterDto(): MatterDto {
        return MatterDto(
            id = this.id,
            caseNumber = this.caseNumber,
            title = this.title,
            description = this.description,
            status = MatterStatusDTO.valueOf(this.status.name),
            priority = MatterPriorityDTO.valueOf(this.priority.name),
            clientName = this.clientName,
            clientContact = this.clientContact,
            opposingParty = this.opposingParty,
            courtName = this.courtName,
            filingDate = this.filingDate,
            estimatedCompletionDate = this.estimatedCompletionDate,
            actualCompletionDate = this.actualCompletionDate,
            assignedLawyerId = this.assignedLawyerId,
            assignedLawyerName = this.assignedLawyerName,
            assignedClerkId = this.assignedClerkId,
            assignedClerkName = this.assignedClerkName,
            notes = this.notes,
            tags = this.tags,
            isActive = this.isActive,
            isOverdue = this.isOverdue,
            isCompleted = this.isCompleted,
            ageInDays = this.ageInDays,
            createdAt = this.createdAt ?: throw IllegalStateException("Created at cannot be null"),
            updatedAt = this.updatedAt ?: throw IllegalStateException("Updated at cannot be null"),
            createdBy = "System", // TODO: Extract from audit info
            updatedBy = "System"  // TODO: Extract from audit info
        )
    }
}