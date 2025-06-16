package dev.ryuzu.astermanagement.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.servers.Server
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

/**
 * OpenAPI configuration for API documentation.
 * Configures Swagger/OpenAPI for the Aster Management API.
 */
@Configuration
class OpenApiConfig {
    
    @Value("\${app.version:1.0.0}")
    private lateinit var appVersion: String
    
    @Value("\${app.description:Legal case management system API}")
    private lateinit var appDescription: String
    
    /**
     * Configures OpenAPI documentation.
     */
    @Bean
    fun customOpenAPI(): OpenAPI {
        return OpenAPI()
            .info(apiInfo())
            .addServersItem(Server().url("/").description("Default server"))
            .components(apiComponents())
            .addSecurityItem(SecurityRequirement().addList("bearerAuth"))
    }
    
    /**
     * API information configuration.
     */
    private fun apiInfo(): Info {
        return Info()
            .title("Aster Management API")
            .version(appVersion)
            .description(appDescription)
            .contact(
                Contact()
                    .name("Aster Management Team")
                    .email("support@astermanagement.dev")
            )
            .license(
                License()
                    .name("Proprietary")
            )
    }
    
    /**
     * API components configuration including security schemes.
     */
    private fun apiComponents(): Components {
        return Components()
            .addSecuritySchemes(
                "bearerAuth",
                SecurityScheme()
                    .name("bearerAuth")
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT token authentication")
            )
    }
    
    /**
     * Development-specific OpenAPI configuration with additional servers.
     */
    @Bean
    @Profile("dev", "local")
    fun devOpenAPI(): OpenAPI {
        return customOpenAPI()
            .addServersItem(Server().url("http://localhost:8080").description("Local development server"))
            .addServersItem(Server().url("https://dev-api.astermanagement.dev").description("Development server"))
    }
    
    /**
     * Production-specific OpenAPI configuration.
     */
    @Bean
    @Profile("prod")
    fun prodOpenAPI(): OpenAPI {
        return customOpenAPI()
            .addServersItem(Server().url("https://api.astermanagement.dev").description("Production server"))
    }
}