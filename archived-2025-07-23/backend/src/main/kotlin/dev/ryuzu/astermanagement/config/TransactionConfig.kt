package dev.ryuzu.astermanagement.config

import org.springframework.context.annotation.Configuration
import org.springframework.transaction.annotation.EnableTransactionManagement

/**
 * Configuration class for transaction management
 * Enables declarative transaction management using @Transactional annotations
 */
@Configuration
@EnableTransactionManagement
class TransactionConfig {
    
    // Default transaction manager will be auto-configured by Spring Boot
    // This configuration class serves as a central location for any
    // transaction-related customizations in the future
}