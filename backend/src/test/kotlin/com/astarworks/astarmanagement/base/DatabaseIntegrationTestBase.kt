package com.astarworks.astarmanagement.base

import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.entity.UserRole
import com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
import org.junit.jupiter.api.BeforeEach
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import jakarta.persistence.EntityManager
import org.springframework.context.annotation.Import
import org.springframework.context.annotation.Primary
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.jdbc.core.JdbcTemplate
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.*

/**
 * Base class for database integration tests using Testcontainers.
 * 
 * This class provides:
 * - PostgreSQL container setup matching production version
 * - Flyway migrations with RLS policies
 * - Multi-tenant test helpers
 * - Security context mocking
 * - Transaction management for test isolation
 */
@Testcontainers
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(DatabaseIntegrationTestBase.TestConfig::class)
abstract class DatabaseIntegrationTestBase {
    
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
            registry.add("spring.jpa.hibernate.ddl-auto") { "validate" }
            registry.add("spring.flyway.enabled") { "true" }
            registry.add("spring.flyway.locations") { "classpath:db/migration" }
            registry.add("spring.flyway.baseline-on-migrate") { "true" }
        }
    }
    
    @TestConfiguration
    class TestConfig {
        @Bean
        @Primary
        fun mockSecurityContextService(): SecurityContextService = mock()
    }
    
    @Autowired
    protected lateinit var entityManager: EntityManager
    
    @Autowired
    protected lateinit var securityContextService: SecurityContextService
    
    @Autowired
    protected lateinit var jdbcTemplate: JdbcTemplate
    
    protected lateinit var defaultTenantId: UUID
    protected lateinit var defaultUserId: UUID
    protected lateinit var defaultUser: User
    
    @BeforeEach
    fun setupBase() {
        // Initialize default test identifiers
        defaultTenantId = UUID.randomUUID()
        defaultUserId = UUID.randomUUID()
        defaultUser = User(
            id = defaultUserId,
            email = "test@example.com",
            password = "password",
            firstName = "Test",
            lastName = "User",
            role = UserRole.USER
        )
        
        // Setup default security context
        setupTenantContext(defaultTenantId, defaultUserId, defaultUser)
        
        // Clear entity manager cache
        entityManager.flush()
        entityManager.clear()
    }
    
    /**
     * Sets up the security context for a specific tenant and user.
     * This simulates the runtime behavior where JWT authentication provides tenant context.
     */
    protected fun setupTenantContext(tenantId: UUID, userId: UUID, user: User) {
        whenever(securityContextService.getCurrentTenantId()).thenReturn(tenantId)
        whenever(securityContextService.getCurrentUserId()).thenReturn(userId)
        whenever(securityContextService.requireCurrentUserId()).thenReturn(userId)
        whenever(securityContextService.requireCurrentTenantId()).thenReturn(tenantId)
        whenever(securityContextService.getCurrentUser()).thenReturn(user)
        whenever(securityContextService.requireCurrentUser()).thenReturn(user)
        
        // Also set PostgreSQL session variables for RLS
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenantId', true)")
        jdbcTemplate.execute("SELECT set_config('app.current_user_id', '$userId', true)")
    }
    
    /**
     * Executes a query with specific tenant context for RLS testing.
     * This allows testing cross-tenant access prevention.
     */
    protected fun <T> withTenantContext(tenantId: UUID, userId: UUID, user: User, block: () -> T): T {
        val originalTenantId = securityContextService.getCurrentTenantId()
        val originalUserId = securityContextService.getCurrentUserId()
        val originalUser = securityContextService.getCurrentUser()
        
        return try {
            setupTenantContext(tenantId, userId, user)
            block()
        } finally {
            // Restore original context
            whenever(securityContextService.getCurrentTenantId()).thenReturn(originalTenantId)
            whenever(securityContextService.getCurrentUserId()).thenReturn(originalUserId)
            whenever(securityContextService.getCurrentUser()).thenReturn(originalUser)
            whenever(securityContextService.requireCurrentTenantId()).thenReturn(originalTenantId ?: defaultTenantId)
            whenever(securityContextService.requireCurrentUserId()).thenReturn(originalUserId ?: defaultUserId)
            whenever(securityContextService.requireCurrentUser()).thenReturn(originalUser ?: defaultUser)
        }
    }
    
    /**
     * Creates a test user for a specific tenant.
     */
    protected fun createTestUser(
        tenantId: UUID,
        email: String = "user-${UUID.randomUUID()}@example.com",
        role: UserRole = UserRole.USER
    ): User {
        return User(
            id = UUID.randomUUID(),
            email = email,
            password = "password",
            firstName = "Test",
            lastName = "User",
            role = role
        )
    }
    
    /**
     * Executes raw SQL for advanced testing scenarios.
     * Useful for validating RLS policies at database level.
     */
    protected fun executeRawSql(sql: String, vararg params: Any?) {
        entityManager.createNativeQuery(sql).apply {
            params.forEachIndexed { index, param ->
                setParameter(index + 1, param)
            }
        }.executeUpdate()
    }
    
    /**
     * Queries raw SQL for validation.
     */
    @Suppress("UNCHECKED_CAST")
    protected fun <T> queryRawSql(sql: String, vararg params: Any?): List<T> {
        return entityManager.createNativeQuery(sql).apply {
            params.forEachIndexed { index, param ->
                setParameter(index + 1, param)
            }
        }.resultList as List<T>
    }
}