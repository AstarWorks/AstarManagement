---
task_id: T11_S05
sprint_sequence_id: S05
status: open
complexity: Medium
last_updated: 2025-01-03T00:00:00Z
---

# Task: Test Utilities and Data Management

## Description
Create comprehensive test utilities and data management tools for integration testing, focusing on test data builders, authentication helpers, and database management utilities. This task builds upon the base Testcontainers infrastructure to provide rich testing capabilities with realistic test data and authentication scenarios.

## Goal / Objectives
- Extend TestDataFactory with builders for all domain entities
- Implement authentication test utilities leveraging existing JWT patterns
- Create database cleanup and state management utilities
- Set up transaction management helpers for testing
- Implement performance measurement and metrics collection

## Acceptance Criteria
- [ ] Test data builders cover all domain entities with fluent interfaces
- [ ] Authentication utilities support multiple user personas and roles
- [ ] Database cleanup ensures complete test isolation
- [ ] Transaction boundaries can be tested effectively
- [ ] Performance metrics are captured for test monitoring
- [ ] Test data maintains referential integrity
- [ ] Utilities integrate seamlessly with base test classes

## Subtasks
- [ ] Extend TestDataFactory with builders for all domain entities
- [ ] Create scenario-based test data sets for common use cases
- [ ] Implement TestAuthenticationProvider using existing JWT utilities
- [ ] Create test user personas with different role combinations
- [ ] Set up DatabaseCleaner utility for test data isolation
- [ ] Implement TestTransactionManager for transaction testing
- [ ] Create TestMetricsCollector for performance monitoring
- [ ] Implement @DirtiesDatabase annotation for test isolation
- [ ] Set up test data snapshot/restore mechanisms
- [ ] Document testing patterns and utility usage

## Technical Implementation Notes

### Test Data Builder Pattern
```kotlin
// Extend existing TestDataFactory
object TestDataFactory {
    fun matter() = MatterBuilder()
    fun user() = UserBuilder()
    fun document() = DocumentBuilder()
    fun audit() = AuditEventBuilder()
    
    class MatterBuilder {
        private var id: UUID = UUID.randomUUID()
        private var title: String = "Test Matter ${UUID.randomUUID()}"
        private var status: MatterStatus = MatterStatus.DRAFT
        private var assignedUser: User? = null
        
        fun withId(id: UUID) = apply { this.id = id }
        fun withTitle(title: String) = apply { this.title = title }
        fun withStatus(status: MatterStatus) = apply { this.status = status }
        fun withAssignedUser(user: User) = apply { this.assignedUser = user }
        
        fun build(): Matter = Matter(
            id = id,
            title = title,
            status = status,
            assignedUser = assignedUser
        )
    }
}
```

### Authentication Test Utilities
```kotlin
// Leverage existing TestSecurityConfig
@Component
class TestAuthenticationProvider {
    fun authenticateAs(username: String, roles: Set<String>) {
        val jwt = TestSecurityConfig.createMockJwt(username, roles)
        SecurityContextHolder.getContext().authentication = jwt
    }
    
    fun authenticateAsLawyer() = authenticateAs("test-lawyer", setOf("LAWYER"))
    fun authenticateAsClerk() = authenticateAs("test-clerk", setOf("CLERK"))
    fun authenticateAsClient() = authenticateAs("test-client", setOf("CLIENT"))
    fun authenticateAsAdmin() = authenticateAs("test-admin", setOf("ADMIN"))
}
```

### Database State Management
```kotlin
@Component
class DatabaseCleaner {
    @Autowired
    private lateinit var entityManager: EntityManager
    
    fun cleanDatabase() {
        entityManager.createNativeQuery("SET REFERENTIAL_INTEGRITY FALSE").executeUpdate()
        
        val tableNames = entityManager.metamodel.entities
            .map { it.name }
            .filter { !it.startsWith("flyway_") }
        
        tableNames.forEach { tableName ->
            entityManager.createNativeQuery("TRUNCATE TABLE $tableName").executeUpdate()
        }
        
        entityManager.createNativeQuery("SET REFERENTIAL_INTEGRITY TRUE").executeUpdate()
    }
}

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class DirtiesDatabase

@Component
class DirtiesDatabaseExecutionListener : TestExecutionListener {
    override fun afterTestMethod(testContext: TestContext) {
        if (testContext.testMethod.isAnnotationPresent(DirtiesDatabase::class.java)) {
            testContext.applicationContext.getBean(DatabaseCleaner::class.java).cleanDatabase()
        }
    }
}
```

### Transaction Testing Utilities
```kotlin
@Component
class TestTransactionManager {
    @Autowired
    private lateinit var transactionTemplate: TransactionTemplate
    
    fun <T> executeInNewTransaction(block: () -> T): T {
        return transactionTemplate.execute { block() }!!
    }
    
    fun assertTransactionActive() {
        assert(TransactionSynchronizationManager.isActualTransactionActive())
    }
    
    fun assertNoTransaction() {
        assert(!TransactionSynchronizationManager.isActualTransactionActive())
    }
}
```

### Performance Metrics Collection
```kotlin
@Component
class TestMetricsCollector {
    private val metrics = mutableMapOf<String, MutableList<Long>>()
    
    fun <T> measureTime(operation: String, block: () -> T): T {
        val start = System.currentTimeMillis()
        return try {
            block()
        } finally {
            val duration = System.currentTimeMillis() - start
            metrics.getOrPut(operation) { mutableListOf() }.add(duration)
        }
    }
    
    fun getMetrics(): Map<String, TestMetrics> {
        return metrics.mapValues { (_, durations) ->
            TestMetrics(
                count = durations.size,
                avg = durations.average(),
                min = durations.minOrNull() ?: 0,
                max = durations.maxOrNull() ?: 0
            )
        }
    }
}
```

### Test Scenario Data Sets
- Create predefined data sets for common testing scenarios
- Legal case lifecycle: draft → review → active → closed
- Multi-user collaboration scenarios
- Permission and access control test cases
- Audit trail verification scenarios

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed