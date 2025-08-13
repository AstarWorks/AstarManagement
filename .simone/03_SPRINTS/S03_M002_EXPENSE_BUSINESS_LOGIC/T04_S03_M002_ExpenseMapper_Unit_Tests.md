# T04_S03_M002_ExpenseMapper_Unit_Tests.md

## Task Meta Information
- **Task ID**: T04_S03_M002
- **Task Name**: ExpenseMapper Unit Tests
- **Sprint**: S03_M002_EXPENSE_BUSINESS_LOGIC
- **Estimated Hours**: 2
- **Priority**: Medium
- **Status**: Pending
- **Assigned**: Backend Developer
- **Dependencies**: 
  - ExpenseMapper implementation must be completed
  - Domain models and DTOs must be finalized
  - Related mappers (Tag, Attachment) should be available

## Purpose
Create comprehensive unit tests for the ExpenseMapper to ensure accurate bidirectional mapping between domain entities and DTOs, proper handling of nested objects, and null safety.

## Research Findings
Based on analysis of existing implementation:

### ExpenseMapper Functionality
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/mapper/ExpenseMapper.kt`:
- Maps between Expense entity and ExpenseResponse/Request DTOs
- Handles nested tag and attachment collections
- Calculates derived fields (netAmount)
- Preserves audit information

### Current Test Coverage
- No existing ExpenseMapper tests found
- Critical for ensuring data integrity in API layer

## Success Criteria
- [ ] Test coverage reaches 100% for ExpenseMapper
- [ ] All mapping methods are tested
- [ ] Null safety is verified
- [ ] Collection mappings are tested
- [ ] Calculated fields are verified
- [ ] Edge cases are covered
- [ ] Performance is acceptable for bulk operations

## Technical Implementation Details

### Test Structure
```kotlin
class ExpenseMapperTest {
    private lateinit var expenseMapper: ExpenseMapper
    private lateinit var tagMapper: TagMapper
    private lateinit var attachmentMapper: AttachmentMapper
    
    @BeforeEach
    fun setUp() {
        tagMapper = TagMapper()
        attachmentMapper = AttachmentMapper()
        expenseMapper = ExpenseMapper(tagMapper, attachmentMapper)
    }
}
```

### Test Categories

1. **Entity to Response Mapping**
   ```kotlin
   @Test
   fun `should map expense entity to response with all fields`()
   @Test
   fun `should calculate netAmount correctly for expense`()
   @Test
   fun `should calculate netAmount correctly for income`()
   @Test
   fun `should map empty collections properly`()
   @Test
   fun `should preserve audit information`()
   ```

2. **Request to Entity Mapping**
   ```kotlin
   @Test
   fun `should map create request to entity`()
   @Test
   fun `should map update request to existing entity`()
   @Test
   fun `should handle null optional fields`()
   @Test
   fun `should set default values correctly`()
   ```

3. **Collection Mapping**
   ```kotlin
   @Test
   fun `should map list of entities to responses`()
   @Test
   fun `should handle empty lists`()
   @Test
   fun `should maintain order in collections`()
   @Test
   fun `should map nested tag collections`()
   @Test
   fun `should map nested attachment collections`()
   ```

4. **Null Safety Tests**
   ```kotlin
   @Test
   fun `should handle null case ID gracefully`()
   @Test
   fun `should handle null memo field`()
   @Test
   fun `should handle null collections as empty`()
   @Test
   fun `should handle null amounts properly`()
   ```

5. **Edge Cases**
   ```kotlin
   @Test
   fun `should handle maximum decimal precision`()
   @Test
   fun `should handle very large amounts`()
   @Test
   fun `should handle special characters in text fields`()
   @Test
   fun `should handle maximum collection sizes`()
   ```

6. **Validation Tests**
   ```kotlin
   @Test
   fun `should validate business rules during mapping`()
   @Test
   fun `should ensure either income or expense amount`()
   @Test
   fun `should validate amount non-negativity`()
   ```

7. **Performance Tests**
   ```kotlin
   @Test
   fun `should map large collections efficiently`()
   @Test
   fun `should handle deep nesting without stack overflow`()
   ```

### Test Data Builders
```kotlin
private fun createTestExpense(): Expense {
    // Comprehensive test expense with all fields
}

private fun createMinimalExpense(): Expense {
    // Expense with only required fields
}

private fun createExpenseWithCollections(): Expense {
    // Expense with tags and attachments
}
```

### Assertions
- Field-by-field comparison
- Collection size and content verification
- Null safety checks
- Type safety validation
- Calculation accuracy

## Dependencies
- JUnit 5 for test framework
- AssertJ for fluent assertions
- Test data builders
- No mocking needed (pure function testing)