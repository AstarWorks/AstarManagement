---
task_id: T04_S01_M002
title: REST Controllers Implementation
status: pending
estimated_hours: 6
actual_hours: null
assigned_to: null
dependencies: ["T02_S01_M002"]
---

# T04_S01_M002: REST Controllers Implementation

## Description
Implement REST controllers for the expense management API endpoints. Create controller classes with proper request mapping, validation, and response handling. Controllers should be thin and delegate business logic to services.

## Acceptance Criteria
- [ ] Create ExpenseController with CRUD endpoints
- [ ] Create TagController with management endpoints
- [ ] Create AttachmentController for file operations
- [ ] Implement proper HTTP status codes
- [ ] Add request validation using @Valid
- [ ] Configure CORS settings
- [ ] Add rate limiting annotations
- [ ] Document endpoints with OpenAPI annotations
- [ ] Follow RESTful naming conventions

## Technical Details

### ExpenseController
```kotlin
@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expense Management", description = "Expense CRUD operations")
class ExpenseController(
    private val expenseService: ExpenseService
) {
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new expense")
    fun createExpense(
        @Valid @RequestBody request: CreateExpenseRequest
    ): ExpenseResponse {
        // Implementation will be added in later sprint
        return ExpenseResponse()
    }
    
    @GetMapping
    @Operation(summary = "List expenses with filters")
    fun listExpenses(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam caseId: UUID?,
        @RequestParam category: String?,
        @RequestParam tagIds: List<UUID>?,
        @RequestParam(defaultValue = "date,desc") sort: String
    ): PagedResponse<ExpenseResponse> {
        // Implementation stub
        return PagedResponse()
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get expense by ID")
    fun getExpense(@PathVariable id: UUID): ExpenseResponse {
        // Implementation stub
        return ExpenseResponse()
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update expense")
    fun updateExpense(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateExpenseRequest
    ): ExpenseResponse {
        // Implementation stub
        return ExpenseResponse()
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete expense")
    fun deleteExpense(@PathVariable id: UUID) {
        // Implementation stub
    }
    
    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create multiple expenses")
    fun createBulkExpenses(
        @Valid @RequestBody requests: List<CreateExpenseRequest>
    ): List<ExpenseResponse> {
        // Implementation stub
        return emptyList()
    }
    
    @GetMapping("/summary")
    @Operation(summary = "Get expense summary")
    fun getExpenseSummary(
        @RequestParam period: String,
        @RequestParam groupBy: String?
    ): ExpenseSummaryResponse {
        // Implementation stub
        return ExpenseSummaryResponse()
    }
}
```

### TagController
```kotlin
@RestController
@RequestMapping("/api/v1/tags")
@Tag(name = "Tag Management", description = "Tag operations for expense categorization")
class TagController(
    private val tagService: TagService
) {
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new tag")
    fun createTag(
        @Valid @RequestBody request: CreateTagRequest
    ): TagResponse {
        // Implementation stub
        return TagResponse()
    }
    
    @GetMapping
    @Operation(summary = "List tags")
    fun listTags(
        @RequestParam scope: TagScope?,
        @RequestParam search: String?
    ): List<TagResponse> {
        // Implementation stub
        return emptyList()
    }
    
    @GetMapping("/suggestions")
    @Operation(summary = "Get tag suggestions")
    fun getTagSuggestions(
        @RequestParam(defaultValue = "10") limit: Int
    ): List<TagResponse> {
        // Implementation stub
        return emptyList()
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update tag")
    fun updateTag(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTagRequest
    ): TagResponse {
        // Implementation stub
        return TagResponse()
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete tag")
    fun deleteTag(@PathVariable id: UUID) {
        // Implementation stub
    }
}
```

### AttachmentController
```kotlin
@RestController
@RequestMapping("/api/v1/attachments")
@Tag(name = "Attachment Management", description = "File upload and management")
class AttachmentController(
    private val attachmentService: AttachmentService
) {
    
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload attachment")
    fun uploadAttachment(
        @RequestParam("file") file: MultipartFile
    ): AttachmentResponse {
        // Implementation stub
        return AttachmentResponse()
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get attachment metadata")
    fun getAttachment(@PathVariable id: UUID): AttachmentResponse {
        // Implementation stub
        return AttachmentResponse()
    }
    
    @GetMapping("/{id}/download")
    @Operation(summary = "Download attachment file")
    fun downloadAttachment(
        @PathVariable id: UUID
    ): ResponseEntity<Resource> {
        // Implementation stub
        return ResponseEntity.ok().build()
    }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete attachment")
    fun deleteAttachment(@PathVariable id: UUID) {
        // Implementation stub
    }
}
```

## Subtasks
- [ ] Create ExpenseController class
- [ ] Create TagController class
- [ ] Create AttachmentController class
- [ ] Add OpenAPI annotations for documentation
- [ ] Configure request validation
- [ ] Set up proper error responses
- [ ] Add controller unit tests
- [ ] Configure CORS settings

## Testing Requirements
- [ ] Controllers return correct HTTP status codes
- [ ] Request validation works properly
- [ ] OpenAPI documentation generates correctly
- [ ] Error responses follow consistent format
- [ ] CORS headers are set correctly

## Notes
- Controllers should be thin - delegate to services
- Use proper HTTP verbs and status codes
- Ensure consistent error response format
- Consider API versioning strategy
- Add rate limiting for bulk operations