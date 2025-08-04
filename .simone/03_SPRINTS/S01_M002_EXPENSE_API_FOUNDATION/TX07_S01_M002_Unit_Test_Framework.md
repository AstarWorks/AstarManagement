---
task_id: T07_S01_M002
title: Unit Test Framework Setup
status: completed
estimated_hours: 3
actual_hours: 3
assigned_to: null
dependencies: ["T01_S01_M002", "T02_S01_M002", "T04_S01_M002"]
updated: 2025-08-04 15:00
completed: 2025-08-04 15:00
---

# T07_S01_M002: Unit Test Framework Setup

## Description
Establish the unit testing framework and conventions for the expense management module. Set up test dependencies, create test fixtures, establish testing patterns, and write initial unit tests to validate the framework.

## Acceptance Criteria
- [x] Configure test dependencies (JUnit 5, MockK, AssertJ)
- [x] Create test fixture builders for domain models
- [x] Set up test base classes for common functionality
- [x] Establish testing conventions and patterns
- [x] Create initial unit tests for validation
- [x] Configure test coverage reporting
- [x] Set up test data factories
- [x] Document testing guidelines

## Technical Details

### Test Dependencies (build.gradle.kts)
```kotlin
dependencies {
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("com.ninja-squad:springmockk:4.0.2")
    testImplementation("org.assertj:assertj-core:3.24.2")
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.kotest:kotest-property:5.8.0")
}
```

### Test Fixture Builders
```kotlin
// Test data builders using Kotlin DSL
object ExpenseFixtures {
    fun expense(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID = UUID.randomUUID(),
        date: LocalDate = LocalDate.now(),
        category: String = "Transportation",
        description: String = "Test expense",
        incomeAmount: BigDecimal = BigDecimal.ZERO,
        expenseAmount: BigDecimal = BigDecimal("1000"),
        balance: BigDecimal = BigDecimal("-1000"),
        caseId: UUID? = null,
        memo: String? = null,
        tags: Set<Tag> = emptySet()
    ) = Expense(
        id = id,
        tenantId = tenantId,
        date = date,
        category = category,
        description = description,
        incomeAmount = incomeAmount,
        expenseAmount = expenseAmount,
        balance = balance,
        caseId = caseId,
        memo = memo,
        tags = tags.toMutableSet()
    )
    
    fun createExpenseRequest(
        date: LocalDate = LocalDate.now(),
        category: String = "Transportation",
        description: String = "Test expense",
        incomeAmount: BigDecimal? = BigDecimal.ZERO,
        expenseAmount: BigDecimal? = BigDecimal("1000"),
        caseId: UUID? = null,
        memo: String? = null,
        tagIds: List<UUID> = emptyList()
    ) = CreateExpenseRequest(
        date = date,
        category = category,
        description = description,
        incomeAmount = incomeAmount,
        expenseAmount = expenseAmount,
        caseId = caseId,
        memo = memo,
        tagIds = tagIds
    )
}

object TagFixtures {
    fun tag(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID = UUID.randomUUID(),
        name: String = "Test Tag",
        nameNormalized: String = "test tag",
        color: String = "#FF5733",
        scope: TagScope = TagScope.TENANT,
        ownerId: UUID? = null,
        usageCount: Int = 0
    ) = Tag(
        id = id,
        tenantId = tenantId,
        name = name,
        nameNormalized = nameNormalized,
        color = color,
        scope = scope,
        ownerId = ownerId,
        usageCount = usageCount
    )
}
```

### Base Test Classes
```kotlin
// Base class for unit tests
@ExtendWith(MockKExtension::class)
abstract class UnitTest {
    @BeforeEach
    fun setupMocks() {
        clearAllMocks()
    }
    
    @AfterEach
    fun verifyMocks() {
        confirmVerified()
    }
}

// Base class for Spring integration tests
@SpringBootTest
@AutoConfigureMockMvc
abstract class IntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc
    
    @Autowired
    lateinit var objectMapper: ObjectMapper
    
    protected fun asJson(obj: Any): String = objectMapper.writeValueAsString(obj)
}

// Base class for repository tests
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = [
    "spring.jpa.hibernate.ddl-auto=create-drop"
])
abstract class RepositoryTest {
    @Autowired
    lateinit var entityManager: TestEntityManager
}
```

### Controller Unit Test Example
```kotlin
class ExpenseControllerTest : UnitTest() {
    
    @MockK
    private lateinit var expenseService: ExpenseService
    
    @InjectMockKs
    private lateinit var expenseController: ExpenseController
    
    @Test
    fun `should create expense successfully`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest()
        val expense = ExpenseFixtures.expense()
        val response = ExpenseResponse.from(expense)
        
        every { expenseService.createExpense(any()) } returns expense
        
        // When
        val result = expenseController.createExpense(request)
        
        // Then
        assertThat(result).isEqualTo(response)
        verify(exactly = 1) { expenseService.createExpense(any()) }
    }
    
    @Test
    fun `should handle validation errors`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            description = "" // Invalid: empty description
        )
        
        // When/Then
        assertThrows<MethodArgumentNotValidException> {
            // Validation should fail before reaching service
            expenseController.createExpense(request)
        }
        
        verify(exactly = 0) { expenseService.createExpense(any()) }
    }
}
```

### Domain Model Unit Test Example
```kotlin
class ExpenseTest {
    
    @Test
    fun `should calculate net amount correctly for expense`() {
        // Given
        val expense = ExpenseFixtures.expense(
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("1000")
        )
        
        // When
        val netAmount = expense.calculateNetAmount()
        
        // Then
        assertThat(netAmount).isEqualByComparingTo(BigDecimal("-1000"))
    }
    
    @Test
    fun `should calculate net amount correctly for income`() {
        // Given
        val expense = ExpenseFixtures.expense(
            incomeAmount = BigDecimal("5000"),
            expenseAmount = BigDecimal.ZERO
        )
        
        // When
        val netAmount = expense.calculateNetAmount()
        
        // Then
        assertThat(netAmount).isEqualByComparingTo(BigDecimal("5000"))
    }
    
    @Test
    fun `should identify expense type correctly`() {
        // Given
        val expense = ExpenseFixtures.expense(
            expenseAmount = BigDecimal("1000")
        )
        
        // Then
        assertThat(expense.isExpense()).isTrue()
        assertThat(expense.isIncome()).isFalse()
    }
}
```

### Validation Test Example
```kotlin
class CreateExpenseRequestValidationTest {
    
    private val validator: Validator = Validation.buildDefaultValidatorFactory().validator
    
    @Test
    fun `should pass validation with valid data`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest()
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isEmpty()
    }
    
    @Test
    fun `should fail validation with future date`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            date = LocalDate.now().plusDays(1)
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).hasSize(1)
        assertThat(violations.first().propertyPath.toString()).isEqualTo("date")
    }
    
    @Test
    fun `should fail validation with negative amounts`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            expenseAmount = BigDecimal("-100")
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
    }
}
```

### Test Configuration
```kotlin
@TestConfiguration
class TestConfig {
    
    @Bean
    fun fixedClock(): Clock = Clock.fixed(
        Instant.parse("2024-01-15T10:00:00Z"),
        ZoneOffset.UTC
    )
    
    @Bean
    fun testTenantContext(): TenantContext {
        return TenantContext().apply {
            setCurrentTenant(UUID.fromString("00000000-0000-0000-0000-000000000001"))
        }
    }
}
```

## Subtasks
- [x] Add test dependencies to build.gradle.kts
- [x] Create test fixture builders
- [x] Set up base test classes
- [x] Write controller unit tests
- [x] Write domain model tests
- [x] Write validation tests
- [x] Configure code coverage reporting
- [x] Document testing conventions

## Testing Requirements
- [x] All test fixtures compile and work correctly
- [x] Base test classes reduce boilerplate
- [x] Tests follow consistent patterns
- [x] Code coverage reporting works
- [x] Tests run in CI pipeline

## Notes
- Use descriptive test names with backticks
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error scenarios
- Keep tests focused and independent