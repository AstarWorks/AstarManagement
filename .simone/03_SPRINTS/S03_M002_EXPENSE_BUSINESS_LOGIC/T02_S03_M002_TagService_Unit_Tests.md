# T02_S03_M002_TagService_Unit_Tests.md

## Task Meta Information
- **Task ID**: T02_S03_M002
- **Task Name**: TagService Unit Tests
- **Sprint**: S03_M002_EXPENSE_BUSINESS_LOGIC
- **Estimated Hours**: 3
- **Priority**: High
- **Status**: Pending
- **Assigned**: Backend Developer
- **Dependencies**: 
  - TagService implementation must be completed
  - Tag domain model must be finalized
  - Security context utilities must be available

## Purpose
Create comprehensive unit tests for the TagService to ensure proper tag management, scope handling, usage tracking, and business rule enforcement. Focus on personal vs shared tag logic and tenant isolation.

## Research Findings
Based on analysis of existing implementation:

### TagService Functionality
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/service/TagService.kt`:
- Creates and manages tags with different scopes
- Tracks tag usage statistics
- Handles tag normalization for search
- Enforces tenant and user-based permissions
- Supports tag suggestions based on usage

### Current Test Coverage
- No existing TagService tests found
- Need to create comprehensive test suite from scratch

## Success Criteria
- [ ] Test coverage reaches >90% for TagService
- [ ] All tag scopes (PERSONAL, TENANT) are tested
- [ ] Tag normalization logic is verified
- [ ] Usage tracking is accurately tested
- [ ] Permission checks are validated
- [ ] Search functionality is tested
- [ ] Concurrent usage scenarios are covered
- [ ] Tests are well-documented and maintainable

## Technical Implementation Details

### Test Structure
```kotlin
class TagServiceTest {
    private lateinit var tagService: TagServiceImpl
    private val tagRepository = mock<TagRepository>()
    private val tagMapper = mock<TagMapper>()
    private val securityContextService = mock<SecurityContextService>()
}
```

### Test Categories

1. **Tag Creation Tests**
   ```kotlin
   @Test
   fun `should create personal tag for current user`()
   @Test
   fun `should create shared tag with proper permissions`()
   @Test
   fun `should normalize tag name on creation`()
   @Test
   fun `should prevent duplicate tags in same scope`()
   ```

2. **Scope Management Tests**
   ```kotlin
   @Test
   fun `should filter personal tags by owner`()
   @Test
   fun `should show shared tags to all tenant users`()
   @Test
   fun `should prevent unauthorized scope changes`()
   ```

3. **Usage Tracking Tests**
   ```kotlin
   @Test
   fun `should increment usage count when tag is used`()
   @Test
   fun `should update last used timestamp`()
   @Test
   fun `should track usage across multiple expenses`()
   @Test
   fun `should handle concurrent usage updates`()
   ```

4. **Search and Normalization Tests**
   ```kotlin
   @Test
   fun `should find tags by normalized name`()
   @Test
   fun `should handle unicode in tag names`()
   @Test
   fun `should support partial name matching`()
   @Test
   fun `should respect scope in search results`()
   ```

5. **Permission Tests**
   ```kotlin
   @Test
   fun `should allow owner to update personal tag`()
   @Test
   fun `should prevent others from updating personal tag`()
   @Test
   fun `should enforce tenant admin permissions for shared tags`()
   ```

6. **Suggestion Algorithm Tests**
   ```kotlin
   @Test
   fun `should suggest frequently used tags first`()
   @Test
   fun `should include both personal and shared tags in suggestions`()
   @Test
   fun `should limit suggestion count`()
   ```

7. **Edge Cases and Error Handling**
   ```kotlin
   @Test
   fun `should handle tag deletion with existing usage`()
   @Test
   fun `should enforce tag name length limits`()
   @Test
   fun `should validate tag color format`()
   @Test
   fun `should handle null or empty tag names`()
   ```

### Mock Scenarios
- Different tenant contexts
- Various user roles and permissions
- Tag repository responses
- Concurrent modification scenarios

### Test Data
- Tags with various Unicode characters
- Tags with different usage counts
- Personal and shared tag combinations
- Edge case tag names

## Dependencies
- Mockito-Kotlin for mocking
- AssertJ for assertions
- JUnit 5 for test framework
- Test security context utilities