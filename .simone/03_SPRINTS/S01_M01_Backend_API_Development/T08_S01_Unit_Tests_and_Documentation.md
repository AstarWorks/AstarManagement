---
task_id: T08_S01
sprint_sequence_id: S01
status: open
complexity: High
last_updated: 2025-06-15T07:48:00Z
---

# Task: Unit Tests and API Documentation

## Description

Implement comprehensive unit tests and integration tests for the Backend API Development sprint, achieving >90% code coverage. Create complete API documentation using OpenAPI/Swagger specification. This task focuses on establishing a robust testing framework that ensures code quality, reliability, and maintainability while providing clear documentation for frontend developers and API consumers.

Based on the existing Spring Boot 3.5.0 + Kotlin project structure with Testcontainers, we need to establish:
- JUnit 5 unit testing patterns for services and controllers
- Spring Boot Test integration with Testcontainers PostgreSQL
- OpenAPI 3.1 documentation generation and validation
- Code coverage reporting with JaCoCo
- Performance testing patterns for API endpoints
- Test data management and fixtures

## Goal / Objectives

- Achieve >90% code coverage across all backend components (services, controllers, repositories)
- Generate comprehensive OpenAPI 3.1 specification following project API guidelines
- Establish testing patterns that can be consistently applied across all modules
- Create performance benchmarks for critical API endpoints
- Implement test automation that integrates with CI/CD pipeline
- Provide clear API documentation for frontend development team

## Acceptance Criteria

- [ ] Unit tests cover all service layer business logic with >90% coverage
- [ ] Integration tests validate all REST API endpoints (FR-010, FR-011, FR-020)
- [ ] Controller layer tests with MockMvc for all HTTP interactions
- [ ] Repository layer tests using @DataJpaTest with Testcontainers
- [ ] OpenAPI 3.1 specification auto-generated and validates against API guidelines
- [ ] Code coverage reports integrated into build pipeline
- [ ] Performance tests for critical endpoints (response time < 200ms p95)
- [ ] Test data fixtures and factories for consistent test setup
- [ ] Mocking strategies for external dependencies (OAuth2, AI services)
- [ ] API documentation includes examples, error codes, and authentication
- [ ] Spring Boot Test slices properly configured (@WebMvcTest, @DataJpaTest)
- [ ] Test profiles separate from production configuration

## Subtasks

- [ ] Configure JaCoCo for code coverage reporting and thresholds
- [ ] Set up SpringDoc OpenAPI for automatic API documentation generation
- [ ] Create unit tests for Matter service layer business logic
- [ ] Implement controller integration tests with MockMvc and security context
- [ ] Build repository tests using @DataJpaTest with Testcontainers PostgreSQL
- [ ] Design test data factories and fixtures using TestContainers or @Sql
- [ ] Create performance tests for API endpoints using Spring Boot actuator
- [ ] Mock external services (OAuth2, AI/PDF processing) in test environment
- [ ] Generate OpenAPI specification with proper examples and validation rules
- [ ] Configure test profiles and separate application-test.properties
- [ ] Implement custom test annotations for common test configurations
- [ ] Set up automated API documentation validation in CI pipeline

## Technical Guidance

### Existing Testing Infrastructure Analysis

The project currently has:
- **Spring Boot 3.5.0** with comprehensive test starter dependencies
- **Testcontainers** configuration for PostgreSQL and Redis
- **JUnit 5** with Kotlin test support
- **Spring REST Docs** for documentation generation (build.gradle.kts line 59)
- **Spring Security Test** for authentication testing
- **Spring Modulith Test** for modular architecture validation

Key test dependencies already configured:
```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-test")
testImplementation("org.springframework.boot:spring-boot-testcontainers")
testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc")
testImplementation("org.springframework.security:spring-security-test")
testImplementation("org.testcontainers:postgresql")
```

### Required Additional Dependencies

Add to build.gradle.kts:

```kotlin
// Code Coverage
id("jacoco")

// OpenAPI Documentation
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")
implementation("org.springdoc:springdoc-openapi-starter-webmvc-api:2.6.0")

// Test Utilities
testImplementation("io.mockk:mockk:1.13.12")
testImplementation("com.ninja-squad:springmockk:4.0.2")
testImplementation("org.springframework.boot:spring-boot-starter-webflux") // For WebTestClient
testImplementation("io.rest-assured:rest-assured:5.5.0")
```

### Testing Strategy Framework

**1. Test Pyramid Structure:**
```
                    /\
                   /  \
                  / E2E \ (Few - Full application with Testcontainers)
                 /______\
                /        \
               /Integration\ (Some - API + Database + Security)
              /__________\
             /            \
            /    Unit      \ (Many - Business logic, isolated)
           /______________\
```

**2. Test Categories by Layer:**

- **Unit Tests** (80%): Pure business logic, no Spring context
- **Integration Tests** (15%): API endpoints with database
- **End-to-End Tests** (5%): Full application scenarios

### JUnit 5 and Kotlin Testing Patterns

**Unit Test Structure:**
```kotlin
@ExtendWith(MockKExtension::class)
class MatterServiceTest {
    
    @MockK
    private lateinit var matterRepository: MatterRepository
    
    @MockK 
    private lateinit var auditService: AuditService
    
    @InjectMockKs
    private lateinit var matterService: MatterService
    
    @Nested
    @DisplayName("Create Matter Tests")
    inner class CreateMatterTests {
        
        @Test
        @DisplayName("Should create matter successfully with valid data")
        fun `should create matter when all data is valid`() {
            // Given
            val createRequest = CreateMatterRequest(
                title = "Contract Review",
                clientId = UUID.randomUUID(),
                status = MatterStatus.INTAKE
            )
            val expectedMatter = createRequest.toMatter()
            
            every { matterRepository.save(any()) } returns expectedMatter
            every { auditService.logMatterCreated(any()) } just Runs
            
            // When
            val result = matterService.createMatter(createRequest)
            
            // Then
            result.shouldNotBeNull()
            result.title shouldBe createRequest.title
            verify { matterRepository.save(any()) }
            verify { auditService.logMatterCreated(any()) }
        }
        
        @Test
        @DisplayName("Should throw exception when client not found")
        fun `should throw exception when client does not exist`() {
            // Given
            val createRequest = CreateMatterRequest(
                title = "Contract Review",
                clientId = UUID.randomUUID(),
                status = MatterStatus.INTAKE
            )
            
            every { matterRepository.save(any()) } throws ClientNotFoundException("Client not found")
            
            // When & Then
            shouldThrow<ClientNotFoundException> {
                matterService.createMatter(createRequest)
            }
        }
    }
}
```

### Spring Boot Test Configuration Patterns

**Controller Integration Tests:**
```kotlin
@WebMvcTest(MatterController::class)
@Import(TestSecurityConfig::class)
@ActiveProfiles("test")
class MatterControllerTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @MockkBean
    private lateinit var matterService: MatterService
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should return matter list with pagination`() {
        // Given
        val matters = listOf(createTestMatter())
        val pageable = PageRequest.of(0, 20)
        val page = PageImpl(matters, pageable, 1)
        
        every { matterService.findAll(any()) } returns page
        
        // When & Then
        mockMvc.perform(
            get("/v1/matters")
                .param("page", "0")
                .param("size", "20")
                .contentType(MediaType.APPLICATION_JSON)
        )
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.data").isArray)
        .andExpect(jsonPath("$.data[0].id").exists())
        .andExpect(jsonPath("$.page.number").value(0))
        .andExpect(jsonPath("$.page.totalElements").value(1))
        .andDo(document("matters-list",
            requestParameters(
                parameterWithName("page").description("Page number (0-based)"),
                parameterWithName("size").description("Page size (max 100)")
            ),
            responseFields(
                fieldWithPath("data[]").description("Array of matters"),
                fieldWithPath("page.number").description("Current page number"),
                fieldWithPath("page.totalElements").description("Total number of elements")
            )
        ))
    }
}
```

**Repository Tests with Testcontainers:**
```kotlin
@DataJpaTest
@Testcontainers
@ActiveProfiles("test")
class MatterRepositoryTest {
    
    @Autowired
    private lateinit var testEntityManager: TestEntityManager
    
    @Autowired
    private lateinit var matterRepository: MatterRepository
    
    @Container
    @ServiceConnection
    companion object {
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
    }
    
    @Test
    fun `should find matters by client id`() {
        // Given
        val client = createTestClient()
        val matter = createTestMatter(clientId = client.id)
        
        testEntityManager.persistAndFlush(client)
        testEntityManager.persistAndFlush(matter)
        testEntityManager.clear()
        
        // When
        val result = matterRepository.findByClientId(client.id)
        
        // Then
        result shouldHaveSize 1
        result[0].clientId shouldBe client.id
    }
}
```

### OpenAPI/Swagger Documentation Setup

**Configuration Class:**
```kotlin
@Configuration
@EnableConfigurationProperties(OpenApiProperties::class)
class OpenApiConfig(private val properties: OpenApiProperties) {
    
    @Bean
    fun openApiSpec(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("AsterManagement API")
                    .version("1.0.0")
                    .description("Legal Case Management System API")
                    .contact(
                        Contact()
                            .name("Development Team")
                            .email("dev@astermanagement.dev")
                    )
                    .license(
                        License()
                            .name("MIT")
                            .url("https://opensource.org/licenses/MIT")
                    )
            )
            .servers(listOf(
                Server().url(properties.serverUrl).description("Development server"),
                Server().url("https://api.astermanagement.com").description("Production server")
            ))
            .security(listOf(
                SecurityRequirement().addList("Bearer Authentication")
            ))
            .components(
                Components()
                    .addSecuritySchemes(
                        "Bearer Authentication",
                        SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                    )
            )
    }
}
```

**Controller Documentation Annotations:**
```kotlin
@RestController
@RequestMapping("/v1/matters")
@Tag(name = "Matters", description = "Legal case management operations")
@SecurityRequirement(name = "Bearer Authentication")
class MatterController(private val matterService: MatterService) {
    
    @Operation(
        summary = "Create new matter",
        description = "Creates a new legal matter/case with the provided details"
    )
    @ApiResponses(value = [
        ApiResponse(
            responseCode = "201",
            description = "Matter created successfully",
            content = [Content(
                mediaType = "application/json",
                schema = Schema(implementation = MatterResponse::class)
            )]
        ),
        ApiResponse(
            responseCode = "400",
            description = "Invalid request data",
            content = [Content(
                mediaType = "application/problem+json",
                schema = Schema(implementation = ProblemDetail::class)
            )]
        ),
        ApiResponse(
            responseCode = "401",
            description = "Authentication required"
        ),
        ApiResponse(
            responseCode = "403", 
            description = "Insufficient permissions"
        )
    ])
    @PostMapping
    fun createMatter(
        @Parameter(description = "Matter creation request")
        @Valid @RequestBody request: CreateMatterRequest
    ): ResponseEntity<MatterResponse> {
        val matter = matterService.createMatter(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(matter.toResponse())
    }
}
```

### Code Coverage Requirements and Tools

**JaCoCo Configuration:**
```kotlin
// In build.gradle.kts
jacoco {
    toolVersion = "0.8.12"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
        csv.required = false
    }
    finalizedBy(tasks.jacocoTestCoverageVerification)
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.90".toBigDecimal() // 90% coverage required
            }
        }
        rule {
            element = "CLASS"
            excludes = listOf(
                "*.config.*",
                "*.dto.*",
                "*Application*"
            )
            limit {
                counter = "LINE"
                minimum = "0.85".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}
```

## Implementation Notes

### Step-by-Step Testing Implementation

**Phase 1: Foundation Setup (Priority: High)**
1. Configure JaCoCo and SpringDoc OpenAPI dependencies
2. Set up test profiles and application-test.properties
3. Create base test configuration classes
4. Establish test data factories and utility classes

**Phase 2: Unit Tests (Priority: High)**
1. Service layer unit tests with MockK
2. Repository unit tests with @DataJpaTest
3. Validator and utility class tests
4. Domain model unit tests

**Phase 3: Integration Tests (Priority: High)**
1. Controller integration tests with MockMvc
2. Security integration tests with @WithMockUser
3. Database integration tests with Testcontainers
4. API endpoint tests with realistic data flows

**Phase 4: Documentation Generation (Priority: Medium)**
1. OpenAPI specification configuration
2. Controller and DTO annotations for documentation
3. API examples and error response documentation
4. Integration with Spring REST Docs for enhanced documentation

**Phase 5: Performance and Coverage (Priority: Medium)**
1. Performance tests for critical endpoints
2. Code coverage validation and reporting
3. CI/CD integration for automated testing
4. Load testing patterns for scalability validation

### Test Data Management Strategy

**Test Fixtures Pattern:**
```kotlin
object TestDataFactory {
    
    fun createTestMatter(
        id: UUID = UUID.randomUUID(),
        title: String = "Test Matter",
        clientId: UUID = UUID.randomUUID(),
        status: MatterStatus = MatterStatus.INTAKE,
        createdAt: LocalDateTime = LocalDateTime.now()
    ): Matter {
        return Matter(
            id = id,
            title = title,
            clientId = clientId,
            status = status,
            createdAt = createdAt,
            updatedAt = createdAt
        )
    }
    
    fun createTestUser(
        id: UUID = UUID.randomUUID(),
        username: String = "testuser",
        email: String = "test@example.com",
        role: UserRole = UserRole.LAWYER
    ): User {
        return User(
            id = id,
            username = username,
            email = email,
            role = role
        )
    }
}
```

**Database Test Configuration:**
```kotlin
@TestConfiguration
class TestDatabaseConfig {
    
    @Bean
    @Primary
    fun testAuditorAware(): AuditorAware<String> {
        return AuditorAware { Optional.of("test-user") }
    }
    
    @EventListener
    fun handleTestData(event: ContextRefreshedEvent) {
        // Load common test data if needed
    }
}
```

### Performance Testing Considerations

**API Performance Tests:**
```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class MatterControllerPerformanceTest {
    
    @Autowired
    private lateinit var testRestTemplate: TestRestTemplate
    
    @Test
    fun `matter creation should complete within 200ms`() {
        val request = CreateMatterRequest(
            title = "Performance Test Matter",
            clientId = UUID.randomUUID(),
            status = MatterStatus.INTAKE
        )
        
        val startTime = System.currentTimeMillis()
        
        val response = testRestTemplate.postForEntity(
            "/v1/matters",
            request,
            MatterResponse::class.java
        )
        
        val duration = System.currentTimeMillis() - startTime
        
        response.statusCode shouldBe HttpStatus.CREATED
        duration shouldBeLessThan 200L // ms
    }
}
```

### Mock Strategy for External Dependencies

**OAuth2 and Security Mocking:**
```kotlin
@TestConfiguration
class TestSecurityConfig {
    
    @Bean
    @Primary
    fun testJwtDecoder(): JwtDecoder {
        return mockk<JwtDecoder>().apply {
            every { decode(any<String>()) } returns createTestJwt()
        }
    }
    
    private fun createTestJwt(): Jwt {
        return Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .claim("sub", "test-user")
            .claim("roles", listOf("LAWYER"))
            .build()
    }
}
```

### CI/CD Integration Points

**Test Automation Pipeline:**
1. Unit tests run on every commit
2. Integration tests run on pull requests
3. Performance tests run nightly
4. Code coverage reports published to GitHub Pages
5. OpenAPI specification validated against API guidelines
6. Automated documentation updates on main branch

## Output Log

*(This section is populated as work progresses on the task)*

[2025-06-15 07:48:00] Task created and ready for implementation