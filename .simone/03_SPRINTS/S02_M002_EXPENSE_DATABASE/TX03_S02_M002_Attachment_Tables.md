# T03_S02_M002_Attachment_Tables

## Task Meta
- **Sprint**: S02_M002_EXPENSE_DATABASE
- **Task ID**: T03_S02_M002_Attachment_Tables
- **Title**: Attachment Tables Implementation
- **Status**: completed
- **Assignee**: Claude
- **Estimated Hours**: 4
- **Actual Hours**: 1
- **Priority**: medium
- **Dependencies**: ["T01_S02_M002", "T02_S02_M002"]
- **Created**: 2025-08-04
- **Updated**: 2025-08-04 06:42

## Description
Create attachment management tables for expense receipts and documents with tenant isolation. This implementation will establish the database foundation for file attachment functionality that allows users to upload and link receipts, invoices, and supporting documents to expense entries while maintaining proper multi-tenant data isolation.

The attachment system supports temporary file uploads that can later be linked to expenses, with automatic cleanup of unlinked temporary files and comprehensive file metadata tracking.

## Acceptance Criteria
- [ ] attachments table created with proper tenant isolation
- [ ] expense_attachments junction table created for many-to-many relationship
- [ ] Row Level Security (RLS) enabled on both tables
- [ ] RLS policies created for tenant-level access control
- [ ] Proper indexes added for performance optimization
- [ ] JPA entities compile successfully with existing domain models
- [ ] Repository methods work with new table structure
- [ ] Application builds without errors
- [ ] Foreign key constraints properly established
- [ ] File lifecycle management (temporary → linked → deleted) supported

## Technical Guidance

### Migration Details
- **Migration File**: V024__Create_attachment_tables.sql
- **Key Domain Models**: 
  - Attachment.kt (already exists with proper JPA annotations)
  - ExpenseAttachment.kt (already exists with composite key)
  - AttachmentStatus enum (TEMPORARY, LINKED, DELETED, FAILED)
- **Repository Interface**: AttachmentRepository.kt (already exists)
- **JPA Repository**: JpaAttachmentRepository.kt (already exists)

### Database Schema Design
```sql
-- attachments table structure (reference from existing Attachment.kt entity)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TEMPORARY',
    linked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    thumbnail_path TEXT,
    thumbnail_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    uploaded_by UUID NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

-- expense_attachments junction table (from ExpenseAttachment.kt entity)
CREATE TABLE expense_attachments (
    expense_id UUID NOT NULL,
    attachment_id UUID NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    linked_by UUID NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    description VARCHAR(255),
    PRIMARY KEY (expense_id, attachment_id)
);
```

### Existing Document Patterns Reference
Based on V013__Create_documents_table.sql, key patterns to follow:
- File metadata columns: file_name, original_name, file_size, mime_type, storage_path
- Security fields: tenant isolation, uploaded_by tracking
- Status lifecycle management with enum constraints
- Performance indexes on common query patterns
- Audit trail fields for compliance

### Many-to-Many Pattern Reference
Based on the ExpenseAttachment entity's composite key structure:
```kotlin
@Entity
@Table(name = "expense_attachments")
@IdClass(ExpenseAttachmentId::class)
class ExpenseAttachment(
    @Id @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    var expense: Expense? = null,
    
    @Id @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id", nullable = false)
    val attachment: Attachment
)
```

### Storage Path Conventions
Following the document management pattern:
- Use relative paths within storage system (MinIO/local filesystem)
- Format: `attachments/{tenant_id}/{yyyy}/{mm}/{dd}/{uuid}/{filename}`
- Thumbnail paths: `thumbnails/{tenant_id}/{yyyy}/{mm}/{dd}/{uuid}/{filename}`
- Temporary files: `temp/{tenant_id}/{upload_session_id}/{filename}`

## Implementation Notes

### Step 1: Create attachments table with metadata
- Create table with all required columns from Attachment.kt entity
- Add tenant_id foreign key constraint to tenants table
- Add uploaded_by foreign key constraint to users table
- Create check constraint for status enum values
- Add validation constraints (file_size > 0, non-blank strings)

### Step 2: Create expense_attachments junction table
- Create composite primary key table matching ExpenseAttachment.kt
- Foreign key constraints to both expenses and attachments tables
- Add CASCADE DELETE from attachments table (orphan removal)
- Add RESTRICT DELETE from expenses table (preserve history)
- Include display_order for UI sorting

### Step 3: Add indexes for efficient querying
- attachments table: tenant_id, status+expires_at, uploaded_by
- expense_attachments: expense_id, attachment_id, linked_at
- Performance indexes matching existing @Index annotations
- Partial indexes for active vs deleted attachments

### Step 4: Implement RLS policies
- attachments table: tenant isolation with uploaded_by ownership
- expense_attachments: tenant isolation based on both expense and attachment access
- Special policies for temporary files (accessible only by uploader)

### Step 5: Update JPA entities and mappings
- Verify Attachment.kt entity compiles with new table structure
- Verify ExpenseAttachment.kt entity compiles with new table structure
- Ensure bidirectional relationship mappings work correctly
- Test cascade operations (especially orphanRemoval = true)

### Step 6: Ensure file operations don't break the build
- Focus on database schema only - no actual file storage implementation
- Verify AttachmentRepository interface methods compile
- Test basic CRUD operations through repository
- Ensure application builds successfully

### RLS Policy Details
```sql
-- Attachments table RLS: tenant + uploader access
CREATE POLICY tenant_isolation_attachments ON attachments
    FOR ALL TO authenticated_users
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Special policy for temporary files (owner access only)
CREATE POLICY temp_file_owner_access ON attachments
    FOR ALL TO authenticated_users
    USING (
        tenant_id = current_tenant_id() AND
        (status != 'TEMPORARY' OR uploaded_by = current_user_id())
    );

-- Expense_attachments junction: access based on expense visibility
CREATE POLICY tenant_isolation_expense_attachments ON expense_attachments
    FOR ALL TO authenticated_users
    USING (
        EXISTS (
            SELECT 1 FROM expenses e 
            WHERE e.id = expense_id 
            AND e.tenant_id = current_tenant_id()
        )
    );
```

### File Lifecycle Management
```sql
-- Status check constraint
ALTER TABLE attachments ADD CONSTRAINT chk_attachment_status 
    CHECK (status IN ('TEMPORARY', 'LINKED', 'DELETED', 'FAILED'));

-- Expiry logic for temporary files
CREATE INDEX idx_attachments_status_expires 
    ON attachments(status, expires_at) 
    WHERE status = 'TEMPORARY' AND expires_at IS NOT NULL;
```

## Verification Commands
```bash
# Check migration status
./gradlew flywayInfo

# Verify build passes
./gradlew build -x test

# Run specific tests
./gradlew test --tests "*Attachment*"

# Check database schema
psql -d astar_management_dev -c "\d attachments"
psql -d astar_management_dev -c "\d expense_attachments"

# Verify indexes
psql -d astar_management_dev -c "\di attachments"
psql -d astar_management_dev -c "\di expense_attachments"

# Test attachment status enum
psql -d astar_management_dev -c "SELECT DISTINCT status FROM attachments;"
```

## Notes
- Focus on database schema only - actual file storage implementation comes later
- Attachment.kt and ExpenseAttachment.kt entities already exist with proper JPA annotations
- AttachmentRepository.kt interface already defines required methods
- File upload/download functionality will be implemented in later sprints
- Temporary file cleanup will be handled by scheduled tasks (not in this sprint)
- Thumbnail generation is optional and will be implemented later
- Storage path is just metadata - actual file storage integration comes later

## Output Log
[2025-08-04 06:30]: Task started - Attachment Tables Implementation
[2025-08-04 06:35]: Created V024__Create_attachment_tables.sql migration with complete schema
[2025-08-04 06:36]: Build successful - all JPA entities compile correctly with new database schema
[2025-08-04 06:45]: Code Review INITIAL - FAIL: Critical issues found (index naming, JPA query references)
[2025-08-04 06:47]: Fixed index naming to match JPA entity annotations exactly
[2025-08-04 06:49]: Fixed JPA repository queries to use uploadedAt instead of auditInfo.createdAt
[2025-08-04 06:50]: Build successful after fixes - all compilation errors resolved
[2025-08-04 06:52]: Code Review FINAL - PASS: All 10 acceptance criteria met, zero tolerance verification passed

## Related Files
- `/IdeaProjects/AstarManagement/backend/src/main/kotlin/com/astarworks/astarmanagement/expense/domain/model/Attachment.kt` (existing domain model)
- `/IdeaProjects/AstarManagement/backend/src/main/kotlin/com/astarworks/astarmanagement/expense/domain/model/ExpenseAttachment.kt` (existing junction entity)
- `/IdeaProjects/AstarManagement/backend/src/main/kotlin/com/astarworks/astarmanagement/expense/domain/repository/AttachmentRepository.kt` (existing interface)
- `/IdeaProjects/AstarManagement/backend/src/main/resources/db/migration/V013__Create_documents_table.sql` (document pattern reference)
- `/IdeaProjects/AstarManagement/backend/src/main/resources/db/migration/V017__Create_tenant_foundation.sql` (RLS pattern reference)
- `/IdeaProjects/AstarManagement/backend/src/main/resources/db/migration/V024__Create_attachment_tables.sql` (new migration file)