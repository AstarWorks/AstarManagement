package com.astarworks.astarmanagement.config

import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.testcontainers.containers.PostgreSQLContainer

/**
 * TestContainer configuration for integration tests.
 * 
 * Provides two DataSource configurations:
 * 1. Default (Primary): Uses app_user with BYPASSRLS for fast general testing
 * 2. RLS DataSource: Uses rls_test_user without BYPASSRLS for RLS policy testing
 */
@TestConfiguration(proxyBeanMethods = false)
class TestContainerConfig {
    
    @Bean
    @ServiceConnection  
    fun postgresContainer(): PostgreSQLContainer<*> {
        return PostgreSQLContainer("postgres:17.5-alpine")
            .withDatabaseName("astarmanagement_test")
            .withUsername("postgres")
            .withPassword("postgres")
            .withReuse(true)
            .withInitScript("test-init.sql")  // Creates both app_user and rls_test_user
    }
    
    @Bean
    @Primary  // Default DataSource for most tests
    fun dataSource(container: PostgreSQLContainer<*>): HikariDataSource {
        return HikariDataSource().apply {
            jdbcUrl = container.jdbcUrl
            username = container.username  // Connect as postgres
            password = container.password
            // Automatically switch to app_user (has BYPASSRLS)
            connectionInitSql = "SET ROLE app_user"
            maximumPoolSize = 10
            minimumIdle = 2
        }
    }
    
    @Bean
    @Qualifier("rlsDataSource")  // DataSource for RLS testing
    fun rlsDataSource(container: PostgreSQLContainer<*>): HikariDataSource {
        return HikariDataSource().apply {
            jdbcUrl = container.jdbcUrl
            username = container.username  // Connect as postgres
            password = container.password
            // Automatically switch to rls_test_user (NO BYPASSRLS)
            connectionInitSql = "SET ROLE rls_test_user"
            maximumPoolSize = 5
            minimumIdle = 1
        }
    }
}