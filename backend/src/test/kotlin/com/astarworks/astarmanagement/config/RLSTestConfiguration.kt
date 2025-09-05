package com.astarworks.astarmanagement.config

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.jdbc.core.JdbcTemplate
import javax.sql.DataSource

/**
 * Test configuration for RLS-specific tests.
 * 
 * Provides JdbcTemplate and other beans that use the RLS DataSource
 * (rls_test_user without BYPASSRLS) for proper RLS policy testing.
 */
@TestConfiguration
class RLSTestConfiguration {
    
    @Bean
    @Qualifier("rlsJdbcTemplate")
    fun rlsJdbcTemplate(@Qualifier("rlsDataSource") dataSource: DataSource): JdbcTemplate {
        return JdbcTemplate(dataSource)
    }
}