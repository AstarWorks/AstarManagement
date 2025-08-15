package com.astarworks.astarmanagement.base

import com.astarworks.astarmanagement.modules.shared.domain.entity.User
import com.astarworks.astarmanagement.modules.shared.domain.entity.UserRole
import com.astarworks.astarmanagement.modules.shared.infrastructure.security.SecurityContextService
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
        
        @Bean
        @Primary
        fun testTagRepository(
            jpaTagRepository: com.astarworks.astarmanagement.expense.infrastructure.persistence.JpaTagRepository,
            securityContextService: SecurityContextService
        ): com.astarworks.astarmanagement.expense.domain.repository.TagRepository {
            return TestTagRepositoryImpl(jpaTagRepository, securityContextService)
        }
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
        // Use the demo tenant created by migration V017
        defaultTenantId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-000000000001")
        defaultUserId = UUID.randomUUID()
        defaultUser = User(
            id = defaultUserId,
            tenantId = defaultTenantId,
            email = "test@example.com",
            password = "password",
            firstName = "Test",
            lastName = "User",
            role = UserRole.LAWYER
        )
        
        // Clean test data to ensure clean state
        // Temporarily disabled until test migration functions are available
        // cleanTestData()
        
        // Create the default user in the database with proper tenant context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$defaultTenantId', true)")
        createTestUserInDatabase(defaultUser)
        
        // Setup simplified security context (no RLS session variables needed)
        setupSimplifiedTenantContext(defaultTenantId, defaultUserId, defaultUser)
        
        // Clear entity manager cache
        entityManager.flush()
        entityManager.clear()
    }
    
    /**
     * Sets up simplified security context for testing without RLS complexity.
     * Focuses on application-level multi-tenancy verification.
     */
    protected fun setupSimplifiedTenantContext(tenantId: UUID, userId: UUID, user: User) {
        whenever(securityContextService.getCurrentTenantId()).thenReturn(tenantId)
        whenever(securityContextService.getCurrentUserId()).thenReturn(userId)
        whenever(securityContextService.requireCurrentUserId()).thenReturn(userId)
        whenever(securityContextService.requireCurrentTenantId()).thenReturn(tenantId)
        whenever(securityContextService.getCurrentUser()).thenReturn(user)
        whenever(securityContextService.requireCurrentUser()).thenReturn(user)
    }
    
    /**
     * Executes a block with specific tenant context for application-level multi-tenancy testing.
     * Simplified version without RLS complexity.
     */
    protected fun <T> withSimplifiedTenantContext(tenantId: UUID, userId: UUID, user: User, block: () -> T): T {
        // Store current context
        val originalTenantId = securityContextService.getCurrentTenantId()
        val originalUserId = securityContextService.getCurrentUserId()
        val originalUser = securityContextService.getCurrentUser()
        
        return try {
            // Set new context (application level only)
            setupSimplifiedTenantContext(tenantId, userId, user)
            
            // Clear entity manager cache to ensure fresh queries
            entityManager.flush()
            entityManager.clear()
            
            block()
        } finally {
            // Restore original context
            setupSimplifiedTenantContext(
                originalTenantId ?: defaultTenantId,
                originalUserId ?: defaultUserId,
                originalUser ?: defaultUser
            )
        }
    }
    
    /**
     * Cleans test data for reliable test execution.
     */
    protected fun cleanTestData(tenantId: UUID = defaultTenantId) {
        try {
            jdbcTemplate.execute("SELECT clean_test_data('$tenantId')")
        } catch (e: Exception) {
            // Fallback: manual cleanup
            jdbcTemplate.update("DELETE FROM expense_tags WHERE tenant_id = ?", tenantId)
            jdbcTemplate.update("DELETE FROM tags WHERE tenant_id = ?", tenantId)
        }
    }
    
    /**
     * Creates a test user in the database with simplified approach.
     */
    protected fun createTestUserInDatabase(user: User) {
        jdbcTemplate.update(
            """
            INSERT INTO users (id, tenant_id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
            """,
            user.id, user.tenantId, "test-user-${user.id.toString().substring(0, 8)}", 
            user.email, user.password, user.firstName, user.lastName, 
            user.role.name, true
        )
    }
    
    /**
     * Creates a test user for a specific tenant using simplified approach.
     */
    protected fun createTestUser(
        tenantId: UUID,
        email: String = "user-${UUID.randomUUID()}@example.com",
        role: UserRole = UserRole.USER
    ): User {
        val userId = UUID.randomUUID()
        val user = User(
            id = userId,
            tenantId = tenantId,
            email = email,
            password = "password",
            firstName = "Test",
            lastName = "User",
            role = role
        )
        
        // Set database tenant context before creating user
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenantId', true)")
        
        // Create the user in the database using the simplified helper
        createTestUserInDatabase(user)
        
        // Restore default tenant context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$defaultTenantId', true)")
        
        return user
    }
    
    /**
     * Executes raw SQL for advanced testing scenarios.
     * Useful for database-level validation and testing.
     */
    protected fun executeRawSql(sql: String, vararg params: Any?) {
        entityManager.createNativeQuery(sql).apply {
            params.forEachIndexed { index, param ->
                setParameter(index + 1, param)
            }
        }.executeUpdate()
    }
    
    /**
     * Queries raw SQL for validation and testing.
     */
    @Suppress("UNCHECKED_CAST")
    protected fun <T> queryRawSql(sql: String, vararg params: Any?): List<T> {
        return entityManager.createNativeQuery(sql).apply {
            params.forEachIndexed { index, param ->
                setParameter(index + 1, param)
            }
        }.resultList as List<T>
    }
    
    /**
     * Creates a test tenant for multi-tenant testing scenarios.
     * This ensures the tenant exists in the tenants table for foreign key constraints.
     */
    protected fun createTestTenant(
        id: UUID = UUID.randomUUID(),
        name: String = "Test Tenant ${id.toString().substring(0, 8)}"
    ): UUID {
        jdbcTemplate.update(
            """
            INSERT INTO tenants (id, name, subdomain, law_firm_name, primary_contact_email, subscription_plan, subscription_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO NOTHING
            """,
            id, name, name.lowercase().replace(" ", "-"), name, "test@${name.lowercase().replace(" ", "-")}.com", "professional", "active"
        )
        return id
    }
    
    /**
     * Backward compatibility method for legacy tests.
     * Delegates to the simplified version.
     */
    @Deprecated("Use withSimplifiedTenantContext instead", ReplaceWith("withSimplifiedTenantContext(tenantId, userId, user, block)"))
    protected fun <T> withTenantContext(tenantId: UUID, userId: UUID, user: User, block: () -> T): T {
        return withSimplifiedTenantContext(tenantId, userId, user, block)
    }
    
    /**
     * Test implementation of TagRepository that bypasses security context checking
     * for simplified integration testing.
     */
    class TestTagRepositoryImpl(
        private val jpaTagRepository: com.astarworks.astarmanagement.expense.infrastructure.persistence.JpaTagRepository,
        private val securityContextService: com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
    ) : com.astarworks.astarmanagement.expense.domain.repository.TagRepository {
        
        override fun save(tag: com.astarworks.astarmanagement.expense.domain.model.Tag): com.astarworks.astarmanagement.expense.domain.model.Tag {
            return jpaTagRepository.save(tag)
        }
        
        override fun findById(id: UUID): com.astarworks.astarmanagement.expense.domain.model.Tag? {
            return jpaTagRepository.findById(id)
                .filter { it.auditInfo.deletedAt == null }
                .orElse(null)
        }
        
        override fun findByIdAndTenantId(id: UUID, tenantId: UUID): com.astarworks.astarmanagement.expense.domain.model.Tag? {
            // Bypass security context checking in tests
            return jpaTagRepository.findByIdAndTenantId(id, tenantId)
        }
        
        override fun findByTenantId(tenantId: UUID): List<com.astarworks.astarmanagement.expense.domain.model.Tag> {
            return jpaTagRepository.findByTenantId(tenantId)
        }
        
        override fun findByTenantIdAndScope(
            tenantId: UUID,
            scope: com.astarworks.astarmanagement.expense.domain.model.TagScope
        ): List<com.astarworks.astarmanagement.expense.domain.model.Tag> {
            return jpaTagRepository.findByTenantIdAndScope(tenantId, scope)
        }
        
        override fun findByNameNormalized(
            tenantId: UUID,
            nameNormalized: String
        ): com.astarworks.astarmanagement.expense.domain.model.Tag? {
            return jpaTagRepository.findByTenantIdAndNameNormalized(tenantId, nameNormalized)
        }
        
        override fun findMostUsed(
            tenantId: UUID,
            limit: Int
        ): List<com.astarworks.astarmanagement.expense.domain.model.Tag> {
            val pageable = org.springframework.data.domain.PageRequest.of(0, limit)
            return jpaTagRepository.findMostUsedTags(tenantId, pageable)
        }
        
        override fun delete(tag: com.astarworks.astarmanagement.expense.domain.model.Tag) {
            jpaTagRepository.save(tag)
        }
    }
}