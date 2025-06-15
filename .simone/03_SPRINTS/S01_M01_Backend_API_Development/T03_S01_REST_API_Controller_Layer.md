---
task_id: T03_S01
sprint_sequence_id: S01
status: open
complexity: High
last_updated: 2025-06-15T10:00:00Z
---

# Task: REST API Controller Layer Implementation

## Description
Implement the REST API controller layer for the Aster Management system, following Spring Boot best practices and the project's API design guidelines. This task focuses on creating robust, well-documented controllers that handle HTTP requests, validation, error handling, and proper response formatting according to the established API conventions.

The controllers will serve as the entry point for all client interactions with the backend API, implementing the OpenAPI 3.1 specification and supporting features like pagination, filtering, internationalization, and proper security annotations.

## Goal / Objectives
Establish a comprehensive REST API controller layer that provides:
- Complete CRUD operations for all core entities (Matter, Document, Memo, Expense)
- Proper HTTP status code handling and error responses
- Request/response validation with meaningful error messages
- Pagination and filtering capabilities
- OpenAPI/Swagger documentation integration
- Security annotations and RBAC enforcement
- Internationalization support (JP/EN)

## Acceptance Criteria
- [ ] All core entity controllers implemented with full CRUD operations
- [ ] Proper HTTP status codes returned for all scenarios (200, 201, 400, 401, 403, 404, 500)
- [ ] Request validation with detailed error responses following RFC 7807 Problem+JSON format
- [ ] Pagination implemented using Spring Data's Pageable with metadata response
- [ ] Filtering support for common query parameters
- [ ] OpenAPI annotations for complete API documentation
- [ ] Security annotations (@PreAuthorize) for role-based access control
- [ ] Internationalization support through Accept-Language header
- [ ] Global exception handler for consistent error formatting
- [ ] Integration tests for all controller endpoints
- [ ] API versioning support (/v1/ prefix)

## Subtasks
- [ ] Create base controller abstract class with common functionality
- [ ] Implement MatterController with full CRUD operations
- [ ] Implement DocumentController with file upload/download support
- [ ] Implement MemoController for client and internal memos
- [ ] Implement ExpenseController with CSV export functionality
- [ ] Implement UserController for user management (admin endpoints)
- [ ] Create global exception handler (@ControllerAdvice)
- [ ] Add OpenAPI configuration and annotations
- [ ] Implement request/response DTOs with validation annotations
- [ ] Add pagination and filtering support
- [ ] Configure security annotations for RBAC
- [ ] Add internationalization message sources
- [ ] Create integration tests for all endpoints
- [ ] Add API versioning configuration
- [ ] Document controller patterns and conventions

## Technical Guidance

### Spring Boot REST Controller Patterns
```kotlin
@RestController
@RequestMapping("/v1/matters")
@Validated
@PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
class MatterController(
    private val matterService: MatterService,
    private val messageSource: MessageSource
) {
    
    @GetMapping
    fun getAllMatters(
        @PageableDefault(size = 20, sort = ["createdAt"], direction = Sort.Direction.DESC) 
        pageable: Pageable,
        @RequestParam(required = false) status: MatterStatus?,
        @RequestParam(required = false) clientName: String?
    ): ResponseEntity<PagedResponse<MatterDto>> {
        // Implementation with filtering and pagination
    }
    
    @PostMapping
    @PreAuthorize("hasRole('LAWYER')")
    fun createMatter(
        @Valid @RequestBody request: CreateMatterRequest
    ): ResponseEntity<MatterDto> {
        // Implementation with 201 Created response
    }
}
```

### HTTP Status Code Conventions
- **200 OK**: Successful GET, PUT operations
- **201 Created**: Successful POST operations (return Location header)
- **204 No Content**: Successful DELETE operations
- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions for resource
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Business rule violations (e.g., duplicate names)
- **500 Internal Server Error**: Unhandled server errors

### Request/Response DTO Patterns
```kotlin
// Request DTOs with validation
data class CreateMatterRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 255, message = "Title must not exceed 255 characters")
    val title: String,
    
    @field:Valid
    val client: ClientInfo,
    
    @field:NotNull(message = "Status is required")
    val status: MatterStatus = MatterStatus.ACTIVE
)

// Response DTOs
data class MatterDto(
    val id: Long,
    val title: String,
    val status: MatterStatus,
    val client: ClientInfo,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime
)

// Paged response wrapper
data class PagedResponse<T>(
    val data: List<T>,
    val page: PageInfo
) {
    data class PageInfo(
        val number: Int,
        val size: Int,
        val totalElements: Long,
        val totalPages: Int
    )
}
```

### Error Handling and Validation Approaches
```kotlin
@ControllerAdvice
class GlobalExceptionHandler(
    private val messageSource: MessageSource
) {
    
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(
        ex: MethodArgumentNotValidException,
        locale: Locale
    ): ResponseEntity<ProblemDetail> {
        val problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            messageSource.getMessage("validation.failed", null, locale)
        )
        problem.type = URI.create("/errors/validation")
        problem.title = "Validation Failed"
        
        val errors = ex.bindingResult.fieldErrors.map { error ->
            mapOf(
                "field" to error.field,
                "message" to messageSource.getMessage(error, locale)
            )
        }
        problem.setProperty("errors", errors)
        
        return ResponseEntity.badRequest().body(problem)
    }
}
```

## Implementation Notes

### Controller Design for CRUD Endpoints
- Use consistent URL patterns: `/v1/{resource}` and `/v1/{resource}/{id}`
- Implement standard HTTP methods (GET, POST, PUT, DELETE)
- Support bulk operations where appropriate (e.g., DELETE multiple items)
- Include proper Content-Type and Accept headers handling
- Implement conditional requests with ETag support for optimization

### Pagination and Filtering Implementation
- Use Spring Data's `Pageable` interface for consistent pagination
- Support sorting with multiple fields: `?sort=createdAt,desc&sort=title,asc`
- Implement query parameters for filtering: `?status=ACTIVE&clientName=Smith`
- Use Specification pattern for complex filtering logic
- Return pagination metadata in response headers or body

### OpenAPI/Swagger Documentation Setup
```kotlin
@Configuration
@OpenAPIDefinition(
    info = Info(
        title = "Aster Management API",
        version = "1.0.0",
        description = "Legal case management system API"
    ),
    security = [SecurityRequirement(name = "bearerAuth")]
)
class OpenApiConfig {
    
    @Bean
    fun customOpenAPI(): OpenAPI {
        return OpenAPI()
            .components(
                Components()
                    .addSecuritySchemes("bearerAuth",
                        SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                    )
            )
    }
}
```

### Security Annotation Patterns
- Use `@PreAuthorize` for method-level security
- Implement role-based access control (LAWYER, CLERK, CLIENT)
- Add resource-level security for data ownership validation
- Support fine-grained permissions for specific operations
- Implement audit logging for sensitive operations

## Output Log
*(This section is populated as work progresses on the task)*
