package dev.ryuzu.astermanagement.repository

import org.springframework.stereotype.Repository

/**
 * Repository interface for migration tracking
 * Currently using JdbcTemplate directly in the service for complex queries
 */
@Repository
interface MigrationRepository {
    // Placeholder for future JPA entity implementation if needed
}