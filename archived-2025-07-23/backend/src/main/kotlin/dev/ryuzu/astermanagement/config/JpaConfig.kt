package dev.ryuzu.astermanagement.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import java.util.*

/**
 * JPA Configuration for basic JPA features
 * Note: JPA Auditing is now configured in EnhancedAuditConfiguration
 */
@Configuration
class JpaConfig {
    // JPA auditing configuration moved to EnhancedAuditConfiguration
    // to consolidate all audit-related configuration in one place
}