package dev.ryuzu.astermanagement.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import java.util.*

/**
 * JPA Configuration for enabling auditing and other JPA features
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
class JpaConfig {

    /**
     * Provides the current user for JPA auditing fields
     * Uses Spring Security context to get the authenticated user
     */
    @Bean
    fun auditorProvider(): AuditorAware<UUID> {
        return AuditorAware {
            val authentication: Authentication? = SecurityContextHolder.getContext().authentication
            
            if (authentication != null && authentication.isAuthenticated && authentication.name != "anonymousUser") {
                try {
                    // Extract user ID from authentication
                    // This assumes the authentication name is the user ID (UUID)
                    // Adjust based on your actual authentication setup
                    Optional.of(UUID.fromString(authentication.name))
                } catch (e: IllegalArgumentException) {
                    // Fallback for development/testing
                    Optional.empty()
                }
            } else {
                Optional.empty()
            }
        }
    }
}