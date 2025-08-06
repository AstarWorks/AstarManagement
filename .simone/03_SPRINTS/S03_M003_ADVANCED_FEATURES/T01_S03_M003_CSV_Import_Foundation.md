---
task_id: T01_S03_M003
title: CSV Import Foundation for Expense Management
status: pending
estimated_hours: 6
actual_hours: null
assigned_to: Claude
dependencies: ["T05_S02_M003_Edit_Expense_Functionality"]
complexity: Medium
updated: null
completed: null
---

# T01_S03_M003: CSV Import Foundation for Expense Management

## Description
Establish the foundational infrastructure for CSV import functionality in the expense management system. This includes backend CSV parsing service, validation framework, template generation, error handling patterns, and format documentation. The foundation will support bulk expense creation from CSV files with comprehensive validation and error reporting.

## Acceptance Criteria
- [ ] Create backend CSV parsing service with streaming support
- [ ] Implement comprehensive validation framework for CSV data
- [ ] Generate downloadable CSV templates with proper headers
- [ ] Create structured error handling for import operations
- [ ] Support Japanese legal practice expense categories
- [ ] Implement tenant isolation for all import operations
- [ ] Handle files up to 1000 rows efficiently
- [ ] Provide detailed validation error reporting
- [ ] Create format documentation with examples
- [ ] Add progress tracking for long import operations

## Technical Details

### 1. Backend CSV Parser Service

**Location**: `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/service/CsvImportService.kt`

**Core Interface**:
```kotlin
@Service
@Transactional
class CsvImportService(
    private val expenseService: ExpenseService,
    private val csvValidationService: CsvValidationService,
    private val tenantContext: TenantContextService
) {
    
    suspend fun importExpenses(
        tenantId: String,
        csvFile: MultipartFile,
        progressCallback: ((ImportProgress) -> Unit)? = null
    ): ImportResult
    
    fun generateTemplate(tenantId: String): ByteArray
    
    fun validateCsvStructure(csvFile: MultipartFile): ValidationResult
}
```

**Import Process Flow**:
1. File validation (size, format, encoding)
2. CSV structure validation (headers, columns)
3. Row-by-row data validation with streaming
4. Business rule validation (categories, amounts, dates)
5. Batch creation with rollback support
6. Progress reporting and error collection

### 2. CSV Validation Framework

**Location**: `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/service/CsvValidationService.kt`

**Validation Layers**:
```kotlin
interface CsvValidationService {
    // File-level validation
    fun validateFile(file: MultipartFile): List<ValidationError>
    
    // Structure validation
    fun validateHeaders(headers: List<String>): List<ValidationError>
    
    // Row validation
    fun validateRow(rowIndex: Int, row: Map<String, String>): List<ValidationError>
    
    // Business validation
    fun validateBusinessRules(expense: CreateExpenseRequest, tenantId: String): List<ValidationError>
}
```

**Validation Rules**:
- Required fields: date, amount, category, description
- Date format validation (ISO 8601 and Japanese formats)
- Amount validation (positive numbers, currency format)
- Category validation against predefined legal practice categories
- Description length limits (1-500 characters)
- Attachment filename validation (if provided)
- Tenant-specific validation rules

### 3. Template Generation Service

**Location**: `backend/src/main/kotlin/com/astarworks/astarmanagement/expense/application/service/CsvTemplateService.kt`

**Template Features**:
```kotlin
@Service
class CsvTemplateService {
    fun generateExpenseTemplate(
        tenantId: String,
        includeExamples: Boolean = true,
        locale: Locale = Locale.JAPANESE
    ): ByteArray
    
    private fun generateHeaders(locale: Locale): List<String>
    private fun generateExampleData(tenantId: String): List<Map<String, String>>
}
```

**Template Structure**:
- Localized headers (Japanese/English)
- Required field indicators
- Format examples in comments
- Sample data rows for each expense category
- Validation notes and instructions

### 4. Error Handling Framework

**Domain Model**:
```kotlin
data class ImportResult(
    val success: Boolean,
    val totalRows: Int,
    val successfulRows: Int,
    val failedRows: Int,
    val errors: List<ImportError>,
    val warnings: List<ImportWarning>,
    val importId: String,
    val duration: Duration
)

data class ImportError(
    val rowIndex: Int,
    val field: String?,
    val errorCode: String,
    val message: String,
    val severity: ErrorSeverity
)

enum class ErrorSeverity {
    CRITICAL,  // Prevents import
    WARNING,   // Allows import with notification
    INFO       // Informational only
}
```

**Error Categories**:
- File format errors (encoding, structure)
- Validation errors (required fields, format)
- Business rule violations (invalid categories, dates)
- System errors (database, permissions)
- Duplicate detection warnings

### 5. Progress Tracking System

**Implementation**:
```kotlin
data class ImportProgress(
    val phase: ImportPhase,
    val currentRow: Int,
    val totalRows: Int,
    val processedRows: Int,
    val errorCount: Int,
    val estimatedTimeRemaining: Duration?
)

enum class ImportPhase {
    VALIDATING_FILE,
    PARSING_STRUCTURE,
    VALIDATING_DATA,
    IMPORTING_EXPENSES,
    FINALIZING
}
```

## Integration Guidelines

### 1. Existing Codebase Integration

**Expense Service Integration**:
- Leverage existing `ExpenseService.createExpense()` for validated records
- Use existing `ExpenseMapper` for request/response transformation
- Follow established tenant isolation patterns from `ExpenseServiceImpl`
- Integrate with existing error handling from `ExpenseExceptionHandler`

**Validation Pattern Usage**:
```kotlin
// Follow existing validation patterns from CreateExpenseRequest
class CsvExpenseValidator {
    fun validateRow(row: CsvRow): ValidationResult {
        return ValidationResult.combine(
            validateRequiredFields(row),
            validateAmountFormat(row.amount),
            validateDateFormat(row.date),
            validateCategory(row.category),
            validateDescription(row.description)
        )
    }
}
```

### 2. Database Transaction Management

**Batch Processing with Rollback**:
```kotlin
@Transactional
suspend fun importExpensesBatch(
    expenses: List<CreateExpenseRequest>,
    tenantId: String
): BatchImportResult {
    return try {
        val results = expenses.mapIndexed { index, expense ->
            expenseService.createExpense(tenantId, expense)
        }
        BatchImportResult.success(results)
    } catch (e: Exception) {
        // Rollback handled by @Transactional
        BatchImportResult.failure(e)
    }
}
```

### 3. File Handling Patterns

**Streaming CSV Processing**:
```kotlin
fun processLargeCsvFile(file: MultipartFile): Sequence<CsvRow> {
    return file.inputStream.bufferedReader().useLines { lines ->
        lines.drop(1) // Skip header
            .mapIndexed { index, line -> 
                parseCsvLine(index + 2, line) // +2 for header and 0-based index
            }
            .filter { it.isValid }
    }
}
```

### 4. Performance Considerations

**Memory Management**:
- Stream processing for large files (avoid loading entire file)
- Batch database operations (configurable batch size)
- Lazy validation to prevent memory spikes
- Progress callbacks to prevent timeout issues

**Configuration**:
```kotlin
@ConfigurationProperties(prefix = "app.csv-import")
data class CsvImportConfig(
    val maxFileSize: Long = 10 * 1024 * 1024, // 10MB
    val maxRows: Int = 1000,
    val batchSize: Int = 50,
    val timeoutMinutes: Int = 10
)
```

## Research Findings

### Existing Codebase Patterns

**Data Models** (from `backend/src/main/kotlin/.../expense/domain/model/Expense.kt`):
- Expense entity with tenant isolation
- Comprehensive audit fields (createdAt, updatedAt, version)
- Category enum with legal practice categories
- Amount handling with BigDecimal for precision

**Validation Patterns** (from `CreateExpenseRequest.kt`):
- JSR-303 annotations for field validation
- Custom validators for business rules
- Tenant-aware validation logic
- Localized error messages

**File Handling** (from existing attachment handling):
- MultipartFile processing patterns
- File size and type validation
- Secure file storage with tenant isolation
- Error handling for file operations

### Legal Practice Categories
Based on existing expense categories:
- 交通費 (Transportation): Train, taxi, parking
- 印紙代 (Stamp fees): Court documents, contracts
- コピー代 (Copy fees): Document reproduction
- 郵送料 (Postage): Mail, courier services
- その他 (Other): Miscellaneous expenses

## Subtasks
- [ ] Create CSV parsing service with streaming support
- [ ] Implement validation framework with Japanese legal context
- [ ] Build template generation service with localization
- [ ] Create comprehensive error handling system
- [ ] Add progress tracking for long operations
- [ ] Implement tenant isolation throughout import process
- [ ] Create unit tests for all validation scenarios
- [ ] Add integration tests with file upload
- [ ] Document CSV format specifications
- [ ] Create performance benchmarks for large files

## Testing Requirements
- [ ] CSV parser handles various encodings (UTF-8, Shift-JIS)
- [ ] Validation correctly identifies all error scenarios
- [ ] Template generation produces valid downloadable files
- [ ] Error messages are clear and actionable
- [ ] Progress tracking works accurately for different file sizes
- [ ] Tenant isolation prevents cross-tenant data leakage
- [ ] Performance meets requirements for 1000-row files
- [ ] Memory usage remains bounded during large imports

## Success Metrics
- Parse and validate 1000-row CSV file in under 30 seconds
- Memory usage stays under 100MB during import process
- Error detection rate of 99%+ for invalid data
- Template download generates valid importable CSV
- Zero cross-tenant data leakage in all scenarios
- All Japanese legal practice expense scenarios supported

## Notes
- This task focuses on backend foundation - UI components in T02_S03_M003
- CSV format should be Excel-compatible for easy editing
- Consider future extensibility for other import formats (Excel, JSON)
- Error messages should be actionable for non-technical users
- Template should include comprehensive examples and validation rules
- Performance is critical for user adoption - prioritize streaming processing

## Implementation Priority
1. Core CSV parsing and validation service (40% of effort)
2. Template generation and format documentation (25% of effort)
3. Error handling framework and progress tracking (20% of effort)
4. Integration with existing expense service (10% of effort)
5. Testing and performance optimization (5% of effort)