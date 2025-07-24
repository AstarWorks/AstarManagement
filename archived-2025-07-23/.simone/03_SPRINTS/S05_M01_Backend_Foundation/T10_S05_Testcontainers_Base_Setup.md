---
task_id: T10_S05
sprint_sequence_id: S05
status: completed
complexity: Medium
last_updated: 2025-01-03T00:00:00Z
---

# Task: Testcontainers Base Setup

## Description
Set up the foundational Testcontainers infrastructure for integration testing, focusing on container configuration, lifecycle management, and base test classes. This task establishes the core testing infrastructure that enables realistic testing of backend services using containerized dependencies like PostgreSQL and Redis.

## Goal / Objectives
- Configure Testcontainers for PostgreSQL 15 and Redis with optimal settings
- Create base test class hierarchy for different testing scenarios
- Implement container lifecycle management with reuse optimization
- Set up test profiles and environment configurations
- Ensure consistent test execution across local and CI/CD environments

## Acceptance Criteria
- [ ] Testcontainers configuration provides PostgreSQL 15 and Redis containers
- [ ] Container reuse is optimized using singleton pattern for faster test execution
- [ ] Base test classes properly manage container lifecycle and Spring context
- [ ] Health checks and startup timeouts are configured for reliability
- [ ] Test containers work seamlessly in both local and CI environments
- [ ] Container logging is configured for debugging capabilities
- [ ] Network configuration supports multi-container scenarios

## Subtasks
- [ ] Enhance TestcontainersConfiguration with container reuse optimization
- [ ] Implement singleton container management for test suite efficiency
- [ ] Create BaseIntegrationTest abstract class with container lifecycle
- [ ] Implement BaseRepositoryTest for JPA repository testing patterns
- [ ] Create BaseServiceTest for service layer integration testing
- [ ] Set up BaseWebTest with full Spring context and security
- [ ] Configure container health checks and startup timeouts
- [ ] Create test profiles for different environments (local, CI, staging)
- [ ] Set up container network aliases for inter-container communication
- [ ] Configure container logging and debugging capabilities

## Technical Implementation Notes

### Container Configuration Strategy
- Leverage existing TestcontainersConfiguration as foundation
- Implement singleton pattern to share containers across test classes
- Use TestContainers' reuse feature with .testcontainers.properties
- Configure appropriate memory and CPU limits for containers

### Base Test Class Hierarchy
```kotlin
@TestConfiguration
class TestcontainersConfiguration {
    companion object {
        @Container
        val postgresContainer = PostgreSQLContainer<Nothing>("postgres:15-alpine")
            .apply {
                withDatabaseName("aster_test")
                withUsername("test")
                withPassword("test")
                withReuse(true)
            }
        
        @Container
        val redisContainer = GenericContainer<Nothing>("redis:7-alpine")
            .apply {
                withExposedPorts(6379)
                withReuse(true)
            }
    }
}

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class BaseIntegrationTest {
    @BeforeAll
    fun startContainers() {
        TestcontainersConfiguration.postgresContainer.start()
        TestcontainersConfiguration.redisContainer.start()
    }
}

abstract class BaseRepositoryTest : BaseIntegrationTest() {
    @Autowired
    lateinit var testEntityManager: TestEntityManager
}

abstract class BaseServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var mockMvc: MockMvc
}
```

### Container Health Checks
- PostgreSQL: Wait for database to accept connections
- Redis: Wait for PING command to return PONG
- Custom health checks for application-specific requirements

### Environment Profiles
- test: Basic integration testing with minimal logging
- test-ci: CI/CD optimized with parallel execution support
- test-debug: Verbose logging for troubleshooting

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed