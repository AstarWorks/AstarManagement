package com.astarworks.astarmanagement.expense.presentation.controller

import com.astarworks.astarmanagement.expense.application.service.ExpenseService
import com.astarworks.astarmanagement.expense.application.service.ExpenseSummaryResponse
import com.astarworks.astarmanagement.expense.presentation.request.CreateExpenseRequest
import com.astarworks.astarmanagement.expense.presentation.request.UpdateExpenseRequest
import com.astarworks.astarmanagement.expense.presentation.response.ExpenseResponse
import com.astarworks.astarmanagement.expense.presentation.response.PagedResponse
import com.astarworks.astarmanagement.expense.presentation.response.ErrorResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.ExampleObject
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

/**
 * REST controller for expense management operations.
 * Provides CRUD endpoints for expense entities with filtering and bulk operations.
 */
@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expense Management", description = "Expense CRUD operations")
@Validated
class ExpenseController(
    private val expenseService: ExpenseService
) {
    
    /**
     * Creates a new expense entry.
     * 
     * @param request The expense creation request with validated data
     * @return The created expense response
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
        summary = "Create a new expense",
        description = "Creates a new expense entry with optional tags and attachments. Supports both income and expense amounts."
    )
    @ApiResponses(value = [
        ApiResponse(
            responseCode = "201",
            description = "Expense created successfully",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = ExpenseResponse::class),
                examples = [ExampleObject(
                    name = "Transportation Expense",
                    value = """{
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "tenantId": "789e0123-e89b-12d3-a456-426614174000",
                        "date": "2024-01-15",
                        "category": "Transportation",
                        "description": "Taxi to district court",
                        "incomeAmount": 0.00,
                        "expenseAmount": 3000.00,
                        "balance": -3000.00,
                        "netAmount": -3000.00,
                        "caseId": "case-456",
                        "memo": "Client meeting transportation",
                        "tags": [
                            {
                                "id": "456e7890-e89b-12d3-a456-426614174000",
                                "name": "🚕 Transportation",
                                "color": "#FF5733",
                                "scope": "TENANT"
                            }
                        ],
                        "attachments": [],
                        "createdAt": "2024-01-15T10:30:00Z",
                        "updatedAt": "2024-01-15T10:30:00Z"
                    }"""
                )]
            )]
        ),
        ApiResponse(
            responseCode = "400",
            description = "Invalid expense data - validation failed",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = ErrorResponse::class),
                examples = [ExampleObject(
                    name = "Validation Error",
                    value = """{
                        "success": false,
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "statusCode": 400,
                            "message": "Validation failed",
                            "details": [
                                {
                                    "field": "description",
                                    "message": "Description is required",
                                    "rejectedValue": null
                                }
                            ]
                        },
                        "meta": {
                            "timestamp": "2024-01-15T10:30:00Z",
                            "requestId": "abc123-def456",
                            "path": "/api/v1/expenses"
                        }
                    }"""
                )]
            )]
        ),
        ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Invalid or missing JWT token"
        )
    ])
    fun createExpense(
        @Valid @RequestBody
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Expense creation request",
            required = true,
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = CreateExpenseRequest::class),
                examples = [ExampleObject(
                    name = "Transportation Expense",
                    value = """{
                        "date": "2024-01-15",
                        "category": "Transportation",
                        "description": "Taxi to district court",
                        "expenseAmount": 3000.00,
                        "incomeAmount": 0.00,
                        "caseId": "case-456",
                        "tagIds": ["456e7890-e89b-12d3-a456-426614174000"],
                        "memo": "Client meeting transportation"
                    }"""
                ), ExampleObject(
                    name = "Client Payment Income",
                    value = """{
                        "date": "2024-01-15",
                        "category": "Legal Fees",
                        "description": "Consultation fee payment",
                        "incomeAmount": 50000.00,
                        "expenseAmount": 0.00,
                        "caseId": "case-123",
                        "tagIds": ["income-tag-id"],
                        "memo": "Initial consultation payment received"
                    }"""
                )]
            )]
        )
        request: CreateExpenseRequest
    ): ExpenseResponse {
        return expenseService.create(request)
    }
    
    /**
     * Lists expenses with optional filters and pagination.
     * 
     * @param page Page number (0-based)
     * @param size Page size
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @param caseId Optional case ID filter
     * @param category Optional category filter
     * @param tagIds Optional tag IDs filter
     * @param sort Sort specification (e.g., "date,desc")
     * @return Paged response of expenses
     */
    @GetMapping
    @Operation(
        summary = "List expenses with filters",
        description = "Retrieves a paginated list of expenses with optional filtering by date range, case, category, and tags."
    )
    @ApiResponses(value = [
        ApiResponse(
            responseCode = "200",
            description = "Expenses retrieved successfully",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = PagedResponse::class),
                examples = [ExampleObject(
                    name = "Expense List",
                    value = """{
                        "data": [
                            {
                                "id": "123e4567-e89b-12d3-a456-426614174000",
                                "tenantId": "789e0123-e89b-12d3-a456-426614174000",
                                "date": "2024-01-15",
                                "category": "Transportation",
                                "description": "Taxi to district court",
                                "expenseAmount": 3000.00,
                                "balance": -3000.00,
                                "tags": [{"name": "🚕 Transportation", "color": "#FF5733"}]
                            }
                        ],
                        "offset": 0,
                        "limit": 20,
                        "totalCount": 1,
                        "hasNext": false
                    }"""
                )]
            )]
        ),
        ApiResponse(
            responseCode = "400",
            description = "Invalid query parameters"
        ),
        ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Invalid or missing JWT token"
        )
    ])
    fun listExpenses(
        @Parameter(description = "Page number (0-based)", example = "0")
        @RequestParam(defaultValue = "0") page: Int,
        
        @Parameter(description = "Page size (max 100)", example = "20")
        @RequestParam(defaultValue = "20") size: Int,
        
        @Parameter(description = "Filter expenses from this date (inclusive)", example = "2024-01-01")
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        
        @Parameter(description = "Filter expenses to this date (inclusive)", example = "2024-01-31")
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        
        @Parameter(description = "Filter by case ID", example = "case-123")
        @RequestParam caseId: UUID?,
        
        @Parameter(description = "Filter by expense category", example = "Transportation")
        @RequestParam category: String?,
        
        @Parameter(description = "Filter by tag IDs (comma-separated)", example = "456e7890-e89b-12d3-a456-426614174000")
        @RequestParam tagIds: List<UUID>?,
        
        @Parameter(description = "Sort specification (field,direction)", example = "date,desc")
        @RequestParam(defaultValue = "date,desc") sort: String
    ): PagedResponse<ExpenseResponse> {
        // Parse sort parameter
        val sortParts = sort.split(",")
        val sortField = sortParts.getOrElse(0) { "date" }
        val sortDirection = if (sortParts.getOrElse(1) { "desc" }.lowercase() == "asc") {
            Sort.Direction.ASC
        } else {
            Sort.Direction.DESC
        }
        
        val pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField))
        
        return expenseService.findByFilters(
            startDate = startDate,
            endDate = endDate,
            caseId = caseId,
            category = category,
            tagIds = tagIds,
            pageable = pageable
        )
    }
    
    /**
     * Retrieves a specific expense by ID.
     * 
     * @param id The expense ID
     * @return The expense details
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get expense by ID")
    fun getExpense(@PathVariable id: UUID): ExpenseResponse {
        return expenseService.findById(id) 
            ?: throw IllegalArgumentException("Expense not found with id: $id")
    }
    
    /**
     * Updates an existing expense.
     * 
     * @param id The expense ID to update
     * @param request The update request with validated data
     * @return The updated expense response
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update expense")
    fun updateExpense(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateExpenseRequest
    ): ExpenseResponse {
        return expenseService.update(id, request)
    }
    
    /**
     * Deletes an expense (soft delete).
     * 
     * @param id The expense ID to delete
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete expense", description = "Soft deletes an expense. The expense can be restored within 30 days.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "204", description = "Expense deleted successfully"),
        ApiResponse(responseCode = "404", description = "Expense not found"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    ])
    fun deleteExpense(@PathVariable id: UUID) {
        expenseService.delete(id)
    }
    
    /**
     * Restores a soft-deleted expense.
     * 
     * @param id The expense ID to restore
     * @return The restored expense response
     */
    @PostMapping("/{id}/restore")
    @Operation(
        summary = "Restore deleted expense",
        description = "Restores a previously soft-deleted expense. Only works within 30 days of deletion."
    )
    @ApiResponses(value = [
        ApiResponse(
            responseCode = "200",
            description = "Expense restored successfully",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = ExpenseResponse::class)
            )]
        ),
        ApiResponse(responseCode = "404", description = "Expense not found or not deleted"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    ])
    fun restoreExpense(@PathVariable id: UUID): ExpenseResponse {
        return expenseService.restore(id)
    }
    
    /**
     * Creates multiple expenses in a single operation.
     * 
     * @param requests List of expense creation requests
     * @return List of created expense responses
     */
    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create multiple expenses")
    fun createBulkExpenses(
        @Valid @RequestBody requests: List<CreateExpenseRequest>
    ): List<ExpenseResponse> {
        return expenseService.createBulk(requests)
    }
    
    /**
     * Gets expense summary with aggregations.
     * 
     * @param period Summary period (e.g., "monthly", "yearly")
     * @param groupBy Optional grouping parameter
     * @return Expense summary response
     */
    @GetMapping("/summary")
    @Operation(summary = "Get expense summary")
    fun getExpenseSummary(
        @RequestParam period: String,
        @RequestParam groupBy: String?
    ): ExpenseSummaryResponse {
        return expenseService.getSummary(period, groupBy)
    }
}