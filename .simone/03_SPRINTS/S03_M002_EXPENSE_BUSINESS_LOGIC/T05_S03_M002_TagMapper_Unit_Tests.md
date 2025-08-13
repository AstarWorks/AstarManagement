# T05_S03_M002_TagMapper_Unit_Tests.md

## Task Meta Information
- **Task ID**: T05_S03_M002
- **Task Name**: TagMapper Unit Tests
- **Sprint**: S03_M002_EXPENSE_BUSINESS_LOGIC
- **Estimated Hours**: 2
- **Priority**: Medium
- **Status**: Pending
- **Assigned**: Backend Developer
- **Dependencies**: 
  - TagMapper implementation must be completed
  - Tag domain model and DTOs must be finalized

## Purpose
Create comprehensive unit tests for the TagMapper to ensure accurate mapping between Tag entities and DTOs, including proper handling of tag scopes, normalization, and usage statistics.

## Research Findings
Based on analysis of existing implementation:

### TagMapper Functionality
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/mapper/TagMapper.kt`:
- Maps between Tag entity and TagResponse/Request DTOs
- Handles tag normalization
- Preserves scope information
- Maps usage statistics
- Handles audit information

### Current Test Coverage
- No existing TagMapper tests found
- Important for tag management feature integrity

## Success Criteria
- [ ] Test coverage reaches 100% for TagMapper
- [ ] All mapping directions are tested
- [ ] Tag normalization is verified
- [ ] Scope mapping is accurate
- [ ] Usage statistics are preserved
- [ ] Null safety is ensured
- [ ] Edge cases are covered

## Technical Implementation Details

### Test Structure
```kotlin
class TagMapperTest {
    private lateinit var tagMapper: TagMapper
    
    @BeforeEach
    fun setUp() {
        tagMapper = TagMapper()
    }
}
```

### Test Categories

1. **Entity to Response Mapping**
   ```kotlin
   @Test
   fun `should map tag entity to response with all fields`()
   @Test
   fun `should preserve tag scope correctly`()
   @Test
   fun `should map usage statistics accurately`()
   @Test
   fun `should include owner ID for personal tags`()
   @Test
   fun `should exclude owner ID for shared tags`()
   ```

2. **Request to Entity Mapping**
   ```kotlin
   @Test
   fun `should map create request to entity`()
   @Test
   fun `should normalize tag name on creation`()
   @Test
   fun `should set default color if not provided`()
   @Test
   fun `should initialize usage count to zero`()
   @Test
   fun `should map update request preserving existing data`()
   ```

3. **Tag Normalization Tests**
   ```kotlin
   @Test
   fun `should normalize tag names to lowercase`()
   @Test
   fun `should handle unicode normalization`()
   @Test
   fun `should trim whitespace from names`()
   @Test
   fun `should handle special characters in normalization`()
   ```

4. **Scope Handling Tests**
   ```kotlin
   @Test
   fun `should map PERSONAL scope correctly`()
   @Test
   fun `should map TENANT scope correctly`()
   @Test
   fun `should validate scope transitions`()
   @Test
   fun `should handle scope-specific fields`()
   ```

5. **Collection Mapping**
   ```kotlin
   @Test
   fun `should map tag collections efficiently`()
   @Test
   fun `should maintain collection order`()
   @Test
   fun `should handle empty collections`()
   @Test
   fun `should map large tag lists`()
   ```

6. **Null Safety Tests**
   ```kotlin
   @Test
   fun `should handle null owner ID for tenant tags`()
   @Test
   fun `should handle null last used timestamp`()
   @Test
   fun `should handle null color with default`()
   @Test
   fun `should handle null description`()
   ```

7. **Edge Cases**
   ```kotlin
   @Test
   fun `should handle maximum tag name length`()
   @Test
   fun `should validate color format`()
   @Test
   fun `should handle emoji in tag names`()
   @Test
   fun `should preserve exact usage count`()
   ```

8. **Audit Information**
   ```kotlin
   @Test
   fun `should preserve creation audit info`()
   @Test
   fun `should preserve update audit info`()
   @Test
   fun `should handle soft delete fields`()
   ```

### Test Data Builders
```kotlin
private fun createPersonalTag(): Tag {
    // Personal tag with owner
}

private fun createSharedTag(): Tag {
    // Tenant-wide shared tag
}

private fun createTagWithUsage(): Tag {
    // Tag with usage statistics
}
```

### Special Considerations
- Tag name normalization algorithm
- Color format validation (#RRGGBB)
- Scope-based field requirements
- Unicode handling in names

## Dependencies
- JUnit 5 for test framework
- AssertJ for fluent assertions
- Test data builders
- No mocking needed (pure function testing)