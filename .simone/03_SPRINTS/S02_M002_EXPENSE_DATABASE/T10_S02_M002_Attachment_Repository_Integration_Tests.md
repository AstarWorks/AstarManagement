# T10_S02_M002_Attachment_Repository_Integration_Tests.md

## Task Meta Information
- **Task ID**: T10_S02_M002
- **Task Name**: Attachment Repository Integration Tests
- **Sprint**: S02_M002_EXPENSE_DATABASE
- **Estimated Hours**: 3
- **Priority**: High
- **Status**: Pending
- **Assigned**: Backend Developer
- **Dependencies**: 
  - T07_S02_M002: Repository Implementation must be completed
  - Attachment domain model and JPA entities must exist
  - File storage configuration must be ready

## Purpose
Implement comprehensive integration tests for the AttachmentRepository to ensure proper file metadata persistence, tenant isolation, expense linking, and all repository operations work correctly with the actual database.

## Research Findings
Based on analysis of existing implementations:

### Existing AttachmentRepository Interface
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/domain/repository/AttachmentRepository.kt`:
- Manages file metadata (not actual file storage)
- Supports tenant-based isolation
- Handles expense-attachment relationships
- Includes file expiry management

### Existing AttachmentRepositoryImpl
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/infrastructure/persistence/AttachmentRepositoryImpl.kt`:
- Implements all interface methods
- Uses JpaAttachmentRepository for database operations
- Manages ExpenseAttachment join table

### Current Test Coverage
- `AttachmentRepositoryIntegrationTest.kt` exists but needs expansion
- Missing test cases for:
  - File metadata validation
  - Expense linking/unlinking
  - Expiry handling
  - Orphaned attachment cleanup

## Success Criteria
- [ ] All AttachmentRepository methods have integration tests
- [ ] Tenant isolation is verified for all operations
- [ ] Expense-attachment relationships work correctly
- [ ] File metadata is properly validated
- [ ] Soft delete functionality is tested
- [ ] Orphaned attachment detection works
- [ ] Tests run successfully in CI/CD pipeline
- [ ] Test coverage reaches >90% for AttachmentRepositoryImpl

## Technical Implementation Details

### Test Structure
```kotlin
@ActiveProfiles("test")
class AttachmentRepositoryIntegrationTest : RepositoryTest() {
    // Test categories:
    // 1. CRUD Operations
    // 2. Tenant Isolation
    // 3. Expense Linking
    // 4. File Metadata Validation
    // 5. Expiry Management
    // 6. Orphaned Attachments
}
```

### Key Test Cases
1. **CRUD Operations**
   - Create attachment with metadata
   - Update attachment properties
   - Find attachment by ID
   - Delete attachment (soft delete)

2. **Tenant Isolation**
   - Attachments from different tenants are isolated
   - No cross-tenant file access
   - Tenant context is properly enforced

3. **Expense Linking**
   - Link attachment to expense
   - Unlink attachment from expense
   - Multiple attachments per expense
   - Attachment reuse across expenses

4. **File Metadata Validation**
   - Valid file types (JPEG, PNG, PDF)
   - File size limits
   - MIME type validation
   - Storage path generation

5. **Expiry Management**
   - Find expired attachments
   - Cleanup of expired files
   - Grace period handling

6. **Edge Cases**
   - Orphaned attachments (no expense links)
   - Concurrent attachment operations
   - Maximum attachments per expense

### Test Data Requirements
- Multiple tenants for isolation testing
- Various file types and sizes
- Expenses with multiple attachments
- Expired and orphaned attachments

### Performance Tests
- Bulk attachment operations
- Query performance with large datasets
- Concurrent access scenarios

## Dependencies
- Spring Boot Test framework
- Testcontainers for PostgreSQL
- Test fixtures for attachment creation
- Mock file storage service
- Security context mocking utilities