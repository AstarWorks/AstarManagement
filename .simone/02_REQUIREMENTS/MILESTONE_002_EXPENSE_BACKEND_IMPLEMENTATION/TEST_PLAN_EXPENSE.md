# Test Plan: Expense Management System

## Document Information
- **Milestone**: MILESTONE_002
- **Feature**: Expense Management Backend
- **Created**: 2025-08-03
- **Status**: Draft

## Test Strategy Overview

This test plan follows an iterative testing approach aligned with the sprint structure, ensuring quality at each development stage through automated tests and manual validation.

## Testing Principles

1. **Test-First Development**: Write tests before implementation
2. **Pyramid Structure**: More unit tests, fewer integration tests, minimal E2E tests
3. **Continuous Testing**: Run tests on every commit
4. **Human Validation**: Manual testing checkpoint after each sprint

## Test Coverage Goals

- **Unit Tests**: 85% code coverage minimum
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user flows only
- **Performance Tests**: Key operations benchmarked

## Sprint-Based Testing Approach

### Sprint 1: Basic API Framework Testing

#### Unit Tests
```kotlin
// ExpenseControllerTest.kt
@Test
fun `should return 201 when creating valid expense`()
@Test
fun `should return 400 when expense data is invalid`()
@Test
fun `should return 404 when updating non-existent expense`()

// ExpenseValidatorTest.kt
@Test
fun `should reject expense with negative amounts`()
@Test
fun `should reject expense with future date`()
@Test
fun `should require either income or expense amount`()
```

#### Integration Tests
```kotlin
// ExpenseRepositoryTest.kt
@DataJpaTest
@Test
fun `should save and retrieve expense with audit info`()
@Test
fun `should filter expenses by date range`()
@Test
fun `should implement soft delete correctly`()
```

#### Manual Testing Checklist
- [ ] API endpoints accessible via Swagger UI
- [ ] Basic CRUD operations work via Postman
- [ ] Error responses follow consistent format
- [ ] Logging outputs are meaningful

### Sprint 2: Database Implementation Testing

#### Migration Tests
```sql
-- Test rollback capability
@Test
fun `should successfully migrate from V017 to V025`()
@Test
fun `should rollback migrations cleanly`()
@Test
fun `should handle migration conflicts`()
```

#### Data Integrity Tests
```kotlin
@Test
fun `should enforce referential integrity for tenant_id`()
@Test
fun `should cascade delete expense_tags when expense deleted`()
@Test
fun `should prevent duplicate tags per tenant`()
@Test
fun `should enforce unique constraints`()
```

#### Performance Tests
```kotlin
@Test
fun `should retrieve 1000 expenses in under 200ms`()
@Test
fun `should handle concurrent expense creation`()
@Test
fun `should optimize queries with proper indexes`()
```

#### Manual Testing Checklist
- [ ] Database migrations run successfully
- [ ] Indexes improve query performance
- [ ] RLS policies enforce tenant isolation
- [ ] Backup and restore procedures work

### Sprint 3: Business Logic Testing

#### Service Layer Tests
```kotlin
// ExpenseServiceTest.kt
@Test
fun `should calculate balance correctly for income`()
@Test
fun `should calculate balance correctly for expense`()
@Test
fun `should update running balance when expense modified`()
@Test
fun `should handle concurrent balance updates`()

// TagServiceTest.kt
@Test
fun `should increment tag usage count`()
@Test
fun `should normalize tag names for search`()
@Test
fun `should enforce tag scope permissions`()
```

#### Validation Tests
```kotlin
@Test
fun `should validate expense amount precision`()
@Test
fun `should enforce maximum description length`()
@Test
fun `should validate date is not in future`()
@Test
fun `should ensure income XOR expense amount`()
```

#### Edge Case Tests
```kotlin
@Test
fun `should handle maximum decimal values`()
@Test
fun `should process unicode in descriptions`()
@Test
fun `should handle timezone conversions`()
@Test
fun `should manage leap year dates`()
```

#### Manual Testing Checklist
- [ ] Business rules enforced correctly
- [ ] Calculations accurate to 2 decimal places
- [ ] Error messages are user-friendly
- [ ] Edge cases handled gracefully

### Sprint 4: Advanced Features Testing

#### Tag Management Tests
```kotlin
// TagIntegrationTest.kt
@Test
fun `should create personal tags for user`()
@Test
fun `should share tenant tags across users`()
@Test
fun `should search tags by normalized name`()
@Test
fun `should suggest frequently used tags`()
```

#### File Attachment Tests
```kotlin
// AttachmentServiceTest.kt
@Test
fun `should upload file to correct storage path`()
@Test
fun `should generate thumbnails for images`()
@Test
fun `should enforce file size limits`()
@Test
fun `should clean up orphaned attachments`()
```

#### Security Tests
```kotlin
@Test
fun `should prevent cross-tenant data access`()
@Test
fun `should validate file upload mime types`()
@Test
fun `should sanitize user inputs`()
@Test
fun `should enforce rate limiting`()
```

#### Manual Testing Checklist
- [ ] Tag colors display correctly
- [ ] File uploads work for all supported formats
- [ ] Thumbnails generate for images
- [ ] Tags autocomplete works efficiently

### Sprint 5: Integration & E2E Testing

#### Frontend Integration Tests
```javascript
// expense-integration.spec.js
describe('Expense Management', () => {
  it('should create expense and update balance')
  it('should attach receipt to expense')
  it('should filter expenses by tags')
  it('should export expense report')
})
```

#### End-to-End Scenarios
1. **Complete Expense Flow**
   - Login as user
   - Create expense with receipt
   - Add multiple tags
   - Verify balance update
   - Edit expense
   - Delete expense
   - Verify audit trail

2. **Bulk Operations**
   - Import 50 expenses
   - Bulk tag assignment
   - Mass delete with confirmation
   - Export to CSV

3. **Multi-User Scenarios**
   - User A creates expense
   - User B views shared expense
   - Admin modifies tag
   - Verify real-time updates

#### Performance Benchmarks
```kotlin
@Test
fun `should handle 100 concurrent users`()
@Test
fun `should process 1000 expenses in under 5 seconds`()
@Test
fun `should maintain sub-200ms response time`()
```

#### Manual Testing Checklist
- [ ] Complete user workflows function correctly
- [ ] No data loss during operations
- [ ] UI updates reflect backend changes
- [ ] Performance meets requirements

## Test Data Management

### Test Data Sets
```kotlin
object TestData {
    val sampleExpenses = listOf(
        // Various expense types
        Expense(description = "Train ticket", expenseAmount = 1000),
        Expense(description = "Court filing fee", expenseAmount = 30000),
        Expense(description = "Client payment", incomeAmount = 100000)
    )
    
    val sampleTags = listOf(
        Tag(name = "🚆 Transportation", color = "#FF5733"),
        Tag(name = "📄 Documents", color = "#33FF57"),
        Tag(name = "⚖️ Court", color = "#3357FF")
    )
}
```

### Data Reset Strategy
- Truncate test data after each test class
- Use database transactions for rollback
- Separate test tenant for isolation

## Test Environments

### Local Development
- H2 in-memory database
- Mocked external services
- Test containers for PostgreSQL

### CI/CD Pipeline
- PostgreSQL test container
- Parallel test execution
- Coverage reports to SonarQube

### Staging Environment
- Production-like PostgreSQL
- Actual file storage (limited)
- Performance monitoring enabled

## Test Automation

### CI Pipeline Configuration
```yaml
test:
  stage: test
  script:
    - ./gradlew test
    - ./gradlew integrationTest
    - ./gradlew jacocoTestReport
  artifacts:
    reports:
      junit:
        - build/test-results/test/*.xml
      coverage:
        - build/reports/jacoco/test/html/**
```

### Automated Test Execution
- Unit tests: On every commit
- Integration tests: On PR creation
- E2E tests: Before deployment
- Performance tests: Nightly

## Manual Testing Procedures

### Exploratory Testing Sessions
- **Duration**: 2 hours per sprint
- **Focus Areas**: 
  - New features
  - Edge cases
  - User experience
  - Performance perception

### UAT Checklist
- [ ] All acceptance criteria met
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Documentation complete

### Bug Reporting Template
```markdown
**Title**: [Brief description]
**Severity**: Critical/High/Medium/Low
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected Result**:
**Actual Result**:
**Environment**: 
**Screenshots/Logs**:
```

## Risk-Based Testing

### High-Risk Areas (Priority 1)
- Balance calculations
- Multi-tenant data isolation
- Financial data integrity
- Authentication/authorization

### Medium-Risk Areas (Priority 2)
- Tag management
- File uploads
- Search functionality
- Bulk operations

### Low-Risk Areas (Priority 3)
- UI preferences
- Export formatting
- Help text
- Tooltips

## Test Metrics & Reporting

### Key Metrics
- Test coverage percentage
- Test execution time
- Defect detection rate
- Test case pass rate
- Mean time to detect (MTTD)

### Weekly Test Report
```markdown
## Week [X] Test Summary
- Tests Run: X
- Tests Passed: X (X%)
- Code Coverage: X%
- Critical Bugs: X
- Performance: X ms avg response

### Areas of Concern:
- 

### Recommendations:
- 
```

## Test Tools & Resources

### Testing Frameworks
- **Unit Tests**: JUnit 5, MockK
- **Integration**: Spring Boot Test, REST Assured
- **E2E**: Cypress, Playwright
- **Performance**: Gatling, JMeter

### Supporting Tools
- **Coverage**: JaCoCo
- **Mocking**: WireMock
- **Containers**: Testcontainers
- **Assertions**: AssertJ, Hamcrest

## Success Criteria

### Sprint Exit Criteria
- All planned tests executed
- >85% tests passing
- No critical bugs
- Performance benchmarks met
- Manual testing completed

### Milestone Completion
- All features tested and verified
- No open critical/high bugs
- Performance requirements met
- Security validated
- User acceptance confirmed

## Appendices

### A. Test Case Repository
- Location: `.simone/05_TESTING/test-cases/`
- Format: Gherkin/BDD style

### B. Bug Tracking
- System: GitHub Issues
- Labels: bug, testing, priority

### C. Performance Baselines
- API Response: <200ms (95th percentile)
- Database Query: <50ms
- File Upload: <5s for 10MB