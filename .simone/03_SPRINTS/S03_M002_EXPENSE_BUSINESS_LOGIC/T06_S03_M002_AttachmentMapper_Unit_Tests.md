# T06_S03_M002_AttachmentMapper_Unit_Tests.md

## Task Meta Information
- **Task ID**: T06_S03_M002
- **Task Name**: AttachmentMapper Unit Tests
- **Sprint**: S03_M002_EXPENSE_BUSINESS_LOGIC
- **Estimated Hours**: 2
- **Priority**: Medium
- **Status**: Pending
- **Assigned**: Backend Developer
- **Dependencies**: 
  - AttachmentMapper implementation must be completed
  - Attachment domain model and DTOs must be finalized

## Purpose
Create comprehensive unit tests for the AttachmentMapper to ensure accurate mapping between Attachment entities and DTOs, including proper handling of file metadata, storage paths, and expense relationships.

## Research Findings
Based on analysis of existing implementation:

### AttachmentMapper Functionality
Located in `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/mapper/AttachmentMapper.kt`:
- Maps between Attachment entity and AttachmentResponse/Request DTOs
- Handles file metadata (size, type, hash)
- Maps storage paths and URLs
- Preserves expense relationships
- Handles audit information

### Current Test Coverage
- No existing AttachmentMapper tests found
- Critical for file management feature

## Success Criteria
- [ ] Test coverage reaches 100% for AttachmentMapper
- [ ] All mapping methods are tested
- [ ] File metadata is accurately mapped
- [ ] URL generation is verified
- [ ] Null safety is ensured
- [ ] Edge cases are covered
- [ ] Performance for bulk operations is tested

## Technical Implementation Details

### Test Structure
```kotlin
class AttachmentMapperTest {
    private lateinit var attachmentMapper: AttachmentMapper
    
    @BeforeEach
    fun setUp() {
        attachmentMapper = AttachmentMapper()
    }
}
```

### Test Categories

1. **Entity to Response Mapping**
   ```kotlin
   @Test
   fun `should map attachment entity to response with all fields`()
   @Test
   fun `should generate download URL correctly`()
   @Test
   fun `should map file metadata accurately`()
   @Test
   fun `should include thumbnail URL for images`()
   @Test
   fun `should exclude thumbnail URL for non-images`()
   ```

2. **Request to Entity Mapping**
   ```kotlin
   @Test
   fun `should map upload request to entity`()
   @Test
   fun `should set upload timestamp`()
   @Test
   fun `should generate unique storage path`()
   @Test
   fun `should preserve original filename`()
   @Test
   fun `should map file metadata from request`()
   ```

3. **File Metadata Tests**
   ```kotlin
   @Test
   fun `should map file size correctly`()
   @Test
   fun `should map MIME type accurately`()
   @Test
   fun `should preserve file hash`()
   @Test
   fun `should handle various file extensions`()
   ```

4. **URL Generation Tests**
   ```kotlin
   @Test
   fun `should generate secure download URLs`()
   @Test
   fun `should include expiry in URLs when configured`()
   @Test
   fun `should handle special characters in filenames`()
   @Test
   fun `should generate thumbnail URLs for supported formats`()
   ```

5. **Collection Mapping**
   ```kotlin
   @Test
   fun `should map attachment collections`()
   @Test
   fun `should maintain attachment order`()
   @Test
   fun `should handle empty collections`()
   @Test
   fun `should map expense attachment relationships`()
   ```

6. **Null Safety Tests**
   ```kotlin
   @Test
   fun `should handle null description`()
   @Test
   fun `should handle null thumbnail path`()
   @Test
   fun `should handle missing file extension`()
   @Test
   fun `should handle null expense relationships`()
   ```

7. **Edge Cases**
   ```kotlin
   @Test
   fun `should handle maximum filename length`()
   @Test
   fun `should handle zero file size`()
   @Test
   fun `should handle unusual MIME types`()
   @Test
   fun `should validate storage path format`()
   ```

8. **Security Considerations**
   ```kotlin
   @Test
   fun `should sanitize filenames for storage`()
   @Test
   fun `should not expose internal storage paths`()
   @Test
   fun `should validate allowed file types`()
   @Test
   fun `should handle path traversal attempts`()
   ```

### Test Data Builders
```kotlin
private fun createImageAttachment(): Attachment {
    // Image attachment with thumbnail
}

private fun createDocumentAttachment(): Attachment {
    // PDF or document attachment
}

private fun createAttachmentWithExpense(): Attachment {
    // Attachment linked to expense
}
```

### Special Validations
- File type restrictions (JPEG, PNG, PDF)
- Maximum file size limits
- Filename sanitization rules
- URL security considerations

### Performance Tests
```kotlin
@Test
fun `should map large attachment lists efficiently`()
@Test
fun `should handle concurrent mapping operations`()
```

## Dependencies
- JUnit 5 for test framework
- AssertJ for fluent assertions
- Test data builders
- No mocking needed (pure function testing)