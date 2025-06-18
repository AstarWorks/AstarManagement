package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.dto.common.PagedResponse
import dev.ryuzu.astermanagement.dto.matter.*
import dev.ryuzu.astermanagement.service.MatterService
import dev.ryuzu.astermanagement.service.MatterSearchService
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
    private val matterSearchService: MatterSearchService,
    private val userRepository: UserRepository
) : BaseController() {
    
    /**
     * Search matters with full-text search capabilities.
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Search matters",
        description = "Search matters using full-text search with highlighting and relevance scoring. Supports basic and advanced search modes."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Search completed successfully"),
        ApiResponse(responseCode = "400", description = "Invalid search parameters"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun searchMatters(
        @RequestParam @Parameter(description = "Search query") query: String,
        @RequestParam(defaultValue = "FULL_TEXT") @Parameter(description = "Search type") searchType: SearchType,
        @RequestParam(defaultValue = "0") @Parameter(description = "Page number (0-based)") page: Int,
        @RequestParam(defaultValue = "20") @Parameter(description = "Page size (1-100)") size: Int
    ): ResponseEntity<PagedResponse<MatterSearchResultDto>> {
        val (validatedPage, validatedSize) = validatePagination(page, size)
        val pageable = PageRequest.of(validatedPage, validatedSize)
        
        val results = matterSearchService.searchMatters(query, searchType, pageable)
        val response = PagedResponse.fromPage(results) { it }
        
        return ok(response)
    }

    /**
     * Get search suggestions for autocomplete.
     */
    @GetMapping("/search/suggestions")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Get search suggestions",
        description = "Get search suggestions for autocomplete functionality based on partial query."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Suggestions retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun getSearchSuggestions(
        @RequestParam @Parameter(description = "Partial search query") query: String,
        @RequestParam(defaultValue = "10") @Parameter(description = "Maximum suggestions") limit: Int
    ): ResponseEntity<List<SearchSuggestionDto>> {
        val suggestions = matterSearchService.getSearchSuggestions(query, limit)
        return ok(suggestions)
    }

    /**
     * Creates a new matter.
     */
    @PostMapping(
        consumes = [MediaType.APPLICATION_JSON_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    @PreAuthorize("hasRole('LAWYER')")
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
        val matter = Matter().apply {
            caseNumber = request.caseNumber
            title = request.title
            description = request.description
            status = request.status
            priority = request.priority
            clientName = request.clientName
            clientContact = request.clientContact
            opposingParty = request.opposingParty
            courtName = request.courtName
            filingDate = request.filingDate
            estimatedCompletionDate = request.estimatedCompletionDate
            assignedLawyer = userRepository.findById(request.assignedLawyerId).orElse(null)
            assignedClerk = request.assignedClerkId?.let { userRepository.findById(it).orElse(null) }
            notes = request.notes
            tags = request.tags.toTypedArray()
        }
        
        val createdMatter = matterService.createMatter(matter)
        return created(createdMatter.toDto(), createdMatter.id.toString())
    }
    
    /**
     * Retrieves a matter by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK') or (hasRole('CLIENT') and @matterSecurityService.isClientMatter(#id, authentication.name))")
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
        return matter?.let { ok(it.toDto()) } ?: notFound()
    }
    
    /**
     * Retrieves all matters with pagination and filtering.
     */
    @GetMapping
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
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
        @RequestParam(required = false) @Parameter(description = "Filter by status") status: MatterStatus?,
        @RequestParam(required = false) @Parameter(description = "Filter by priority") priority: MatterPriority?,
        @RequestParam(required = false) @Parameter(description = "Filter by client name (partial match)") clientName: String?,
        @RequestParam(required = false) @Parameter(description = "Filter by assigned lawyer") assignedLawyer: UUID?
    ): ResponseEntity<PagedResponse<MatterDto>> {
        val (validatedPage, validatedSize) = validatePagination(page, size)
        val sortParams = parseSortParams(sort)
        val pageable = PageRequest.of(validatedPage, validatedSize, sortParams)
        
        val matters = matterService.getAllMatters(pageable, status, clientName)
        val response = PagedResponse.fromPage(matters) { it.toDto() }
        
        return ok(response)
    }
    
    /**
     * Updates an existing matter.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LAWYER') or (hasRole('CLERK') and @matterSecurityService.isAssignedClerk(#id, authentication.name))")
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
        val existingMatter = matterService.getMatterById(id) ?: return notFound()
        
        existingMatter.apply {
            title = request.title
            description = request.description
            clientName = request.clientName
            clientContact = request.clientContact
            opposingParty = request.opposingParty
            courtName = request.courtName
            filingDate = request.filingDate
            estimatedCompletionDate = request.estimatedCompletionDate
            request.priority?.let { priority = it }
            request.assignedLawyerId?.let { assignedLawyer = userRepository.findById(it).orElse(null) }
            request.assignedClerkId?.let { assignedClerk = userRepository.findById(it).orElse(null) }
            request.notes?.let { notes = it }
            request.tags?.let { tags = it.toTypedArray() }
        }
        
        val result = matterService.updateMatter(id, existingMatter)
        return result?.let { ok(it.toDto()) } ?: notFound()
    }
    
    /**
     * Updates the status of a matter.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('LAWYER')")
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
            val result = matterService.updateMatterStatus(id, request.status, request.comment, userId)
            result?.let { ok(it.toDto()) } ?: notFound()
        } catch (e: IllegalStateException) {
            // Invalid status transition
            ResponseEntity.badRequest().build()
        }
    }
    
    /**
     * Soft deletes a matter.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LAWYER')")
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
        return if (matterService.deleteMatter(id)) {
            noContent()
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    
    /**
     * Validate a status transition before execution.
     */
    @PostMapping("/{id}/validate-transition")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Validate status transition",
        description = "Validate if a status transition is allowed for the current user and matter state"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Transition is valid"),
        ApiResponse(responseCode = "400", description = "Invalid transition"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Matter not found")
    )
    fun validateStatusTransition(
        @PathVariable @Parameter(description = "Matter ID") id: UUID,
        @RequestBody @Valid request: ValidateTransitionRequest,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<ValidateTransitionResponse> {
        val matter = matterService.getMatterById(id) ?: 
            return notFound()

        val currentUser = getCurrentUser()
        val userRole = currentUser.role

        // Import the status transition rules
        val transitionValid = com.astermanagement.api.domain.StatusTransitionRules.isTransitionAllowed(
            matter.status, 
            request.newStatus
        )
        
        val roleCanPerform = com.astermanagement.api.domain.StatusTransitionRules.canRolePerformTransition(
            userRole, 
            matter.status, 
            request.newStatus
        )
        
        val isCritical = com.astermanagement.api.domain.StatusTransitionRules.isCriticalTransition(
            matter.status, 
            request.newStatus
        )
        
        val requiresReason = com.astermanagement.api.domain.StatusTransitionRules.requiresReason(
            matter.status, 
            request.newStatus
        )

        val isValid = transitionValid && roleCanPerform
        val errorMessage = if (!isValid) {
            com.astermanagement.api.domain.StatusTransitionRules.getTransitionError(
                matter.status, 
                request.newStatus, 
                userRole
            )
        } else null

        val response = ValidateTransitionResponse(
            isValid = isValid,
            requiresReason = requiresReason,
            isCritical = isCritical,
            errorMessage = errorMessage,
            currentStatus = matter.status,
            targetStatus = request.newStatus
        )

        return if (isValid) ok(response) else badRequest(response)
    }

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
     * Extension function to convert Matter entity to DTO.
     */
    private fun Matter.toDto(): MatterDto {
        return MatterDto(
            id = this.id!!,
            caseNumber = this.caseNumber,
            title = this.title,
            description = this.description,
            status = this.status,
            priority = this.priority,
            clientName = this.clientName,
            clientContact = this.clientContact,
            opposingParty = this.opposingParty,
            courtName = this.courtName,
            filingDate = this.filingDate,
            estimatedCompletionDate = this.estimatedCompletionDate,
            actualCompletionDate = this.actualCompletionDate,
            assignedLawyerId = this.assignedLawyer?.id,
            assignedLawyerName = this.assignedLawyer?.let { "${it.firstName} ${it.lastName}" },
            assignedClerkId = this.assignedClerk?.id,
            assignedClerkName = this.assignedClerk?.let { "${it.firstName} ${it.lastName}" },
            notes = this.notes,
            tags = this.tags.toList(),
            isActive = this.isActive,
            isOverdue = this.isOverdue,
            isCompleted = this.isCompleted,
            ageInDays = this.ageInDays,
            createdAt = this.createdAt ?: throw IllegalStateException("Created at cannot be null"),
            updatedAt = this.updatedAt ?: throw IllegalStateException("Updated at cannot be null"),
            createdBy = this.createdBy?.toString() ?: "System",
            updatedBy = this.updatedBy?.toString() ?: "System"
        )
    }
}