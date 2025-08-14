package com.astarworks.astarmanagement.base

import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.jdbc.core.JdbcTemplate
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.*

/**
 * Simplified database test base that validates infrastructure without JPA entities.
 * Used for T08 requirements validation focusing on:
 * - PostgreSQL Testcontainers
 * - Flyway migrations
 * - RLS policies
 * - Performance validation
 */
@Testcontainers
@SpringBootTest(properties = [
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.show-sql=false"
])
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
abstract class SimpleDatabaseTestBase {
    
    companion object {
        @Container
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:15-alpine")
            .withDatabaseName("astarmanagement_test")
            .withUsername("test")
            .withPassword("test")
            .withCommand("postgres", "-c", "shared_preload_libraries=pg_stat_statements")
        
        @JvmStatic
        @DynamicPropertySource
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.flyway.enabled") { "true" }
            registry.add("spring.flyway.locations") { "classpath:db/migration" }
            registry.add("spring.flyway.baseline-on-migrate") { "true" }
        }
    }
    
    @Autowired
    protected lateinit var jdbcTemplate: JdbcTemplate
    
    /**
     * Queries raw SQL for validation.
     */
    @Suppress("UNCHECKED_CAST")
    protected fun <T> queryRawSql(sql: String, vararg params: Any?): List<T> {
        return jdbcTemplate.queryForList(sql, *params) as List<T>
    }
}