# Testing Conventions

## Overview

This document outlines the testing conventions and best practices for the Astar Management backend application.

## Test Framework Stack

- **JUnit 5** - Core testing framework
- **MockK** - Kotlin-native mocking library
- **SpringMockK** - Spring Boot integration for MockK
- **AssertJ** - Fluent assertion library
- **Kotest** - Property-based testing
- **JaCoCo** - Code coverage reporting (85% minimum requirement)

## Test Structure

### Base Test Classes

We provide base classes to reduce boilerplate:

1. **UnitTest** - For pure unit tests with MockK setup
2. **IntegrationTest** - For Spring Boot integration tests
3. **RepositoryTest** - For JPA repository tests with H2

### Test Organization

```
src/test/kotlin/
├── com/astarworks/astarmanagement/
│   ├── base/                    # Base test classes
│   ├── config/                  # Test configuration
│   └── expense/
│       ├── domain/             # Domain model tests
│       ├── infrastructure/     # Repository tests
│       ├── presentation/       # Controller tests
│       └── fixtures/           # Test data builders
```

## Testing Patterns

### 1. Test Data Builders

Use fixture builders for creating test data:

```kotlin
val expense = ExpenseFixtures.expense(
    date = LocalDate.now(),
    category = "Transportation",
    expenseAmount = BigDecimal("1000")
)
```

### 2. AAA Pattern

Follow Arrange-Act-Assert pattern:

```kotlin
@Test
fun `should calculate net amount correctly`() {
    // Arrange
    val expense = ExpenseFixtures.expense(expenseAmount = BigDecimal("1000"))
    
    // Act
    val netAmount = expense.calculateNetAmount()
    
    // Assert
    assertThat(netAmount).isEqualByComparingTo(BigDecimal("-1000"))
}
```

### 3. Descriptive Test Names

Use backticks for readable test names:

```kotlin
@Test
fun `should fail validation with future date`() {
    // test implementation
}
```

### 4. Validation Testing

Comprehensive validation testing for DTOs:

```kotlin
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
```

## Mocking Guidelines

### Use MockK for Kotlin

```kotlin
@Test
fun `should call service when creating expense`() {
    // Given
    val service = mockk<ExpenseService>()
    every { service.createExpense(any(), any()) } returns expense
    
    // When
    service.createExpense(tenantId, request)
    
    // Then
    verify { service.createExpense(tenantId, request) }
}
```

### Repository Testing

Use `@DataJpaTest` with custom configuration:

```kotlin
@DataJpaTest
class ExpenseRepositoryTest : RepositoryTest() {
    @Autowired
    private lateinit var repository: ExpenseRepository
    
    @Test
    fun `should find expenses by tenant`() {
        // test implementation
    }
}
```

## Code Coverage

- **Minimum requirement**: 85% coverage
- **Exclude from coverage**:
  - Configuration classes
  - Data classes (DTOs)
  - Generated code
  
Configure exclusions in build.gradle.kts:

```kotlin
tasks.jacocoTestReport {
    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude(
                    "**/config/**",
                    "**/dto/**",
                    "**/*Application*"
                )
            }
        })
    )
}
```

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on execution order
2. **Clear Test Data**: Use descriptive variable names and realistic test data
3. **Single Assertion Focus**: Prefer multiple small tests over one large test
4. **Mock External Dependencies**: Always mock external services and repositories in unit tests
5. **Use Fixed Time**: Use `TestConfig.fixedClock()` for consistent time-based tests
6. **Test Edge Cases**: Include tests for null values, empty collections, and boundary conditions

## Running Tests

```bash
# Run all tests
./gradlew test

# Run with coverage
./gradlew test jacocoTestReport

# Run specific test class
./gradlew test --tests ExpenseTest

# Run tests in debug mode
./gradlew test --debug-jvm
```

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Commits to main branch
- Release builds

Failed tests or coverage below 85% will block the build.