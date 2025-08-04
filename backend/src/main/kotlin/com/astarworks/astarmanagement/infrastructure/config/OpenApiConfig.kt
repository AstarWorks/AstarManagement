package com.astarworks.astarmanagement.infrastructure.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.servers.Server
import org.springdoc.core.models.GroupedOpenApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * OpenAPI (Swagger) configuration for the Astar Management API
 */
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
    
    @Bean
    fun expenseApiGroup(): GroupedOpenApi {
        return GroupedOpenApi.builder()
            .group("expense-api")
            .displayName("Expense Management API")
            .pathsToMatch("/api/v1/expenses/**", "/api/v1/tags/**", "/api/v1/attachments/**")
            .build()
    }
    
    @Bean
    fun authApiGroup(): GroupedOpenApi {
        return GroupedOpenApi.builder()
            .group("auth-api")
            .displayName("Authentication API")
            .pathsToMatch("/api/auth/**")
            .build()
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