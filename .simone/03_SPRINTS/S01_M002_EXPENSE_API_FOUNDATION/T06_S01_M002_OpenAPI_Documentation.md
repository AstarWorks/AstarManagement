---
task_id: T06_S01_M002
title: OpenAPI/Swagger Documentation Setup
status: pending
estimated_hours: 3
actual_hours: null
assigned_to: null
dependencies: ["T04_S01_M002"]
---

# T06_S01_M002: OpenAPI/Swagger Documentation Setup

## Description
Configure OpenAPI (Swagger) documentation for the expense management API. Set up Springdoc OpenAPI integration, configure API documentation metadata, and ensure all endpoints are properly documented with examples.

## Acceptance Criteria
- [ ] Configure Springdoc OpenAPI dependency
- [ ] Set up OpenAPI configuration with API metadata
- [ ] Configure security schemes for JWT authentication
- [ ] Add API examples for requests and responses
- [ ] Group endpoints by logical categories
- [ ] Configure Swagger UI accessibility at /swagger-ui
- [ ] Add API versioning information
- [ ] Include schema definitions for all DTOs
- [ ] Configure API servers for different environments

## Technical Details

### Dependencies (build.gradle.kts)
```kotlin
dependencies {
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0")
    implementation("org.springdoc:springdoc-openapi-starter-common:2.2.0")
}
```

### OpenAPI Configuration
```kotlin
@Configuration
class OpenApiConfig {
    
    @Bean
    fun customOpenAPI(): OpenAPI {
        return OpenAPI()
            .info(apiInfo())
            .servers(listOf(
                Server().url("http://localhost:8080").description("Local Development"),
                Server().url("https://api.astar-management.com").description("Production")
            ))
            .components(Components()
                .addSecuritySchemes("bearer-jwt", 
                    SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("JWT authentication token")
                )
            )
            .addSecurityItem(SecurityRequirement().addList("bearer-jwt"))
    }
    
    private fun apiInfo(): Info {
        return Info()
            .title("Astar Management - Expense API")
            .description("""
                Expense management API for legal practice management system.
                
                ## Features
                - Expense tracking with income/expense separation
                - Tag-based categorization
                - Receipt attachment support
                - Multi-tenant data isolation
                - Real-time balance calculations
                
                ## Authentication
                All endpoints require JWT Bearer token authentication.
                Include the token in the Authorization header:
                ```
                Authorization: Bearer <your-jwt-token>
                ```
            """.trimIndent())
            .version("1.0.0")
            .contact(Contact()
                .name("Astar Management Team")
                .email("support@astar-management.com")
            )
            .license(License()
                .name("Proprietary")
            )
    }
}
```

### API Grouping Configuration
```kotlin
@Bean
fun groupedOpenApi(): GroupedOpenApi {
    return GroupedOpenApi.builder()
        .group("expense-api")
        .pathsToMatch("/api/v1/expenses/**", "/api/v1/tags/**", "/api/v1/attachments/**")
        .build()
}
```

### Controller Documentation Enhancements
```kotlin
@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expense Management", description = "Operations for managing expenses")
class ExpenseController {
    
    @PostMapping
    @Operation(
        summary = "Create a new expense",
        description = "Creates a new expense entry with optional tags and attachments"
    )
    @ApiResponses(value = [
        ApiResponse(
            responseCode = "201",
            description = "Expense created successfully",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = ExpenseResponse::class),
                examples = [ExampleObject(
                    name = "Expense Response",
                    value = """{
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "date": "2024-01-15",
                        "category": "Transportation",
                        "description": "Taxi to court",
                        "expenseAmount": 3000,
                        "balance": -3000,
                        "tags": [
                            {
                                "id": "456e7890-e89b-12d3-a456-426614174000",
                                "name": "🚕 Transportation",
                                "color": "#FF5733"
                            }
                        ]
                    }"""
                )]
            )]
        ),
        ApiResponse(
            responseCode = "400",
            description = "Invalid expense data",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = ErrorResponse::class)
            )]
        ),
        ApiResponse(
            responseCode = "401",
            description = "Unauthorized - Invalid or missing JWT token"
        )
    ])
    fun createExpense(
        @RequestBody
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Expense creation request",
            required = true,
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = CreateExpenseRequest::class),
                examples = [ExampleObject(
                    name = "Create Expense",
                    value = """{
                        "date": "2024-01-15",
                        "category": "Transportation",
                        "description": "Taxi to court",
                        "expenseAmount": 3000,
                        "caseId": "789e0123-e89b-12d3-a456-426614174000",
                        "tagIds": ["456e7890-e89b-12d3-a456-426614174000"],
                        "memo": "Client meeting transportation"
                    }"""
                )]
            )]
        )
        request: CreateExpenseRequest
    ): ExpenseResponse {
        // Implementation
    }
}
```

### Schema Documentation
```kotlin
@Schema(description = "Request to create a new expense")
data class CreateExpenseRequest(
    @Schema(
        description = "Date of the expense",
        example = "2024-01-15",
        required = true
    )
    val date: LocalDate,
    
    @Schema(
        description = "Expense category",
        example = "Transportation",
        required = true,
        maxLength = 50
    )
    val category: String,
    
    @Schema(
        description = "Detailed description of the expense",
        example = "Taxi fare to district court",
        required = true,
        maxLength = 500
    )
    val description: String,
    
    @Schema(
        description = "Income amount (for deposits/refunds)",
        example = "0.00",
        minimum = "0",
        format = "decimal"
    )
    val incomeAmount: BigDecimal? = BigDecimal.ZERO,
    
    @Schema(
        description = "Expense amount",
        example = "3000.00",
        minimum = "0",
        format = "decimal"
    )
    val expenseAmount: BigDecimal? = BigDecimal.ZERO
)
```

### Application Properties
```properties
# OpenAPI Configuration
springdoc.api-docs.enabled=true
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.enabled=true
springdoc.swagger-ui.path=/swagger-ui
springdoc.swagger-ui.try-it-out-enabled=true
springdoc.swagger-ui.operations-sorter=method
springdoc.swagger-ui.tags-sorter=alpha
springdoc.swagger-ui.persist-authorization=true
springdoc.packages-to-scan=com.astarmanagement.expense
springdoc.default-produces-media-type=application/json
```

## Subtasks
- [ ] Add Springdoc dependencies
- [ ] Create OpenAPI configuration class
- [ ] Configure security schemes
- [ ] Add API grouping configuration
- [ ] Enhance controller documentation
- [ ] Add schema documentation to DTOs
- [ ] Configure application properties
- [ ] Test Swagger UI accessibility

## Testing Requirements
- [ ] Swagger UI loads at /swagger-ui
- [ ] All endpoints are documented
- [ ] Security scheme works with JWT
- [ ] Examples render correctly
- [ ] Schema definitions are complete

## Notes
- Keep API documentation up-to-date with code changes
- Use meaningful examples that demonstrate real usage
- Group related endpoints for better organization
- Consider API versioning strategy for future updates