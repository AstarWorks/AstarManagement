# T03_S03_M002_AttachmentService_Unit_Tests.md

## Task Meta Information
- **Task ID**: T03_S03_M002
- **Task Name**: AttachmentService Unit Tests
- **Sprint**: S03_M002_EXPENSE_BUSINESS_LOGIC
- **Estimated Hours**: 3
- **Priority**: High
- **Status**: Pending
- **Assigned**: Backend Developer
- **Dependencies**: 
  - AttachmentService implementation must be completed
  - File storage service interface must be defined
  - Attachment domain model must be finalized

## Purpose
Create comprehensive unit tests for the AttachmentService to ensure proper file handling, metadata management, expense linking, and security validations. Focus on file type validation, size limits, and orphaned attachment handling.

## Research Findings
Based on analysis of existing implementation:

### AttachmentService Functionality
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/service/AttachmentService.kt`:
- Manages file metadata (not actual file storage)
- Validates file types and sizes
- Links attachments to expenses
- Handles attachment expiry
- Manages orphaned attachments

### Current Test Coverage
- No existing AttachmentService tests found
- Need to create comprehensive test suite from scratch

## Success Criteria
- [ ] Test coverage reaches >90% for AttachmentService
- [ ] File type validation is thoroughly tested
- [ ] Size limit enforcement is verified
- [ ] Expense linking/unlinking is tested
- [ ] Orphaned attachment detection works
- [ ] Security validations are covered
- [ ] Concurrent operations are tested
- [ ] Error scenarios are properly handled

## Technical Implementation Details

### Test Structure
```kotlin
class AttachmentServiceTest {
    private lateinit var attachmentService: AttachmentServiceImpl
    private val attachmentRepository = mock<AttachmentRepository>()
    private val fileStorageService = mock<FileStorageService>()
    private val attachmentMapper = mock<AttachmentMapper>()
    private val securityContextService = mock<SecurityContextService>()
}
```

### Test Categories

1. **File Upload Tests**
   ```kotlin
   @Test
   fun `should accept valid file types (JPEG, PNG, PDF)`()
   @Test
   fun `should reject invalid file types`()
   @Test
   fun `should enforce file size limits`()
   @Test
   fun `should generate unique storage paths`()
   @Test
   fun `should handle upload failures gracefully`()
   ```

2. **Metadata Management Tests**
   ```kotlin
   @Test
   fun `should store correct file metadata`()
   @Test
   fun `should calculate file hash correctly`()
   @Test
   fun `should detect duplicate files by hash`()
   @Test
   fun `should update metadata on file replacement`()
   ```

3. **Expense Linking Tests**
   ```kotlin
   @Test
   fun `should link attachment to expense`()
   @Test
   fun `should unlink attachment from expense`()
   @Test
   fun `should support multiple attachments per expense`()
   @Test
   fun `should prevent linking to non-existent expense`()
   @Test
   fun `should handle concurrent linking operations`()
   ```

4. **Security and Permissions Tests**
   ```kotlin
   @Test
   fun `should enforce tenant isolation for attachments`()
   @Test
   fun `should validate user permissions for attachment access`()
   @Test
   fun `should prevent cross-tenant attachment sharing`()
   @Test
   fun `should sanitize file names for security`()
   ```

5. **Orphaned Attachment Tests**
   ```kotlin
   @Test
   fun `should identify orphaned attachments`()
   @Test
   fun `should cleanup orphaned attachments after grace period`()
   @Test
   fun `should not delete recently orphaned attachments`()
   @Test
   fun `should handle re-linking of orphaned attachments`()
   ```

6. **Expiry Management Tests**
   ```kotlin
   @Test
   fun `should mark attachments as expired`()
   @Test
   fun `should find expired attachments for cleanup`()
   @Test
   fun `should respect retention policies`()
   @Test
   fun `should handle expiry date updates`()
   ```

7. **Error Handling Tests**
   ```kotlin
   @Test
   fun `should handle storage service failures`()
   @Test
   fun `should rollback metadata on upload failure`()
   @Test
   fun `should provide meaningful error messages`()
   @Test
   fun `should handle corrupted file scenarios`()
   ```

8. **Performance Tests**
   ```kotlin
   @Test
   fun `should handle bulk attachment operations efficiently`()
   @Test
   fun `should optimize duplicate file detection`()
   @Test
   fun `should paginate large attachment lists`()
   ```

### Mock Scenarios
- File storage service responses
- Various file types and sizes
- Upload success and failure scenarios
- Concurrent operation simulations

### Test Data
- Sample files of different types
- Files at size boundaries
- Malformed file names
- Various MIME types

## Dependencies
- Mockito-Kotlin for mocking
- AssertJ for assertions
- JUnit 5 for test framework
- Test file utilities
- Security context mocking