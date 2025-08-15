package com.astarworks.astarmanagement.modules.financial.expense.infrastructure.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/**
 * Web configuration for the expense module.
 * Configures CORS settings for API endpoints.
 */
@Configuration
class WebConfig : WebMvcConfigurer {
    
    /**
     * Configures CORS mappings for expense API endpoints.
     * Allows cross-origin requests from frontend applications.
     */
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/api/v1/**")
            .allowedOriginPatterns("http://localhost:*", "https://localhost:*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600)
    }
}