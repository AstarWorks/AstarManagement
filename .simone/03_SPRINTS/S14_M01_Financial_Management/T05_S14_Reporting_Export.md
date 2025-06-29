# T05_S14: Financial Reporting and Export Functionality

## 📋 Task Overview

**Sprint**: S14_M01_Financial_Management  
**Type**: Feature Development  
**Complexity**: Medium  
**Status**: Todo  
**Estimated Hours**: 12-16

### Description
Implement comprehensive financial reporting and export functionality for the Aster Management system. This includes CSV export capabilities, PDF report generation, a custom report builder interface, and scheduled reporting system. The implementation should provide flexible export formats, customizable report templates, and automated report generation for regular financial analysis and compliance requirements.

### Business Value
- Enables efficient financial data export for accounting systems and external reporting
- Provides PDF reports for client billing and internal financial analysis
- Streamlines compliance reporting with automated generation and scheduling
- Offers customizable reporting to meet varied business needs and legal requirements
- Improves financial transparency with regular automated reports

### Requirements
- ✅ Implement CSV export functionality with configurable columns
- ✅ Create PDF report generation system with professional templates
- ✅ Build custom report builder interface for flexible report creation
- ✅ Implement scheduled reporting system with email delivery
- ✅ Support multiple export formats (CSV, PDF, Excel)
- ✅ Create report templates for common financial scenarios
- ✅ Add report filtering and date range selection
- ✅ Implement background job processing for large reports
- ✅ Create report history and audit trail
- ✅ Support Japanese localization for reports

## 🗄️ Database Schema Analysis

### Existing Financial Data Sources

Based on codebase analysis, the system has:

1. **Expenses Table** (`V005__Create_supporting_tables.sql`):
   ```sql
   CREATE TABLE expenses (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
       description VARCHAR(500) NOT NULL,
       amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
       currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
       expense_date DATE NOT NULL,
       expense_type VARCHAR(50) NOT NULL,
       is_billable BOOLEAN DEFAULT false,
       receipt_path VARCHAR(255),
       notes TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Audit System** (for tracking report generation):
   - Existing `AuditEvent` and `MatterAuditExportDto` classes
   - `MatterAuditController.exportMatterAuditTrail()` method as reference

### Required Extensions

```sql
-- New table for report configurations and scheduling
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (
        report_type IN ('EXPENSE_SUMMARY', 'BILLABLE_HOURS', 'MATTER_COSTS', 
                       'PER_DIEM_SUMMARY', 'CUSTOM', 'COMPLIANCE')
    ),
    template_config JSONB NOT NULL,
    filter_config JSONB,
    schedule_config JSONB,
    output_format VARCHAR(20) DEFAULT 'PDF' CHECK (
        output_format IN ('PDF', 'CSV', 'EXCEL')
    ),
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for report execution history
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES financial_reports(id) ON DELETE CASCADE,
    execution_type VARCHAR(20) DEFAULT 'MANUAL' CHECK (
        execution_type IN ('MANUAL', 'SCHEDULED')
    ),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')
    ),
    parameters JSONB,
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID
);
```

## 💻 Technical Guidance

### Backend Implementation

#### 1. Report Service Architecture

```kotlin
// Report service for core functionality
@Service
class FinancialReportService(
    private val expenseRepository: ExpenseRepository,
    private val pdfGenerator: PDFGeneratorService,
    private val csvExporter: CSVExportService,
    private val taskExecutor: TaskExecutor
) {
    
    fun generateExpenseReport(
        reportRequest: ExpenseReportRequest
    ): ReportExecutionDto {
        // Implementation for expense report generation
    }
    
    @Async
    fun generateReportAsync(
        reportId: UUID,
        parameters: Map<String, Any>
    ): CompletableFuture<ReportExecutionDto> {
        // Async report generation for large datasets
    }
    
    fun exportToCsv(
        data: List<ExpenseDto>,
        columns: List<String>
    ): ByteArray {
        // CSV export implementation
    }
    
    fun generatePdfReport(
        templateName: String,
        data: Map<String, Any>
    ): ByteArray {
        // PDF generation using templates
    }
}
```

#### 2. PDF Generation Setup

Add to `build.gradle.kts`:
```kotlin
dependencies {
    // PDF generation
    implementation("com.itextpdf:itext7-core:7.2.5")
    implementation("org.xhtmlrenderer:flying-saucer-pdf-itext5:9.1.22")
    
    // Excel export
    implementation("org.apache.poi:poi-ooxml:5.2.4")
    
    // CSV handling
    implementation("com.opencsv:opencsv:5.8")
    
    // Template engine for reports
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
}
```

#### 3. Scheduled Reporting Implementation

```kotlin
@Component
@EnableScheduling
class ReportSchedulerService(
    private val reportService: FinancialReportService,
    private val reportRepository: FinancialReportRepository
) {
    
    @Scheduled(cron = "0 0 9 * * MON") // Every Monday at 9 AM
    fun executeWeeklyReports() {
        val weeklyReports = reportRepository.findActiveWeeklyReports()
        weeklyReports.forEach { report ->
            reportService.generateReportAsync(report.id, emptyMap())
        }
    }
    
    @Scheduled(cron = "0 0 9 1 * *") // First day of month at 9 AM
    fun executeMonthlyReports() {
        // Monthly report execution
    }
}
```

#### 4. REST API Endpoints

```kotlin
@RestController
@RequestMapping("/v1/financial/reports")
@Tag(name = "Financial Reports", description = "Financial reporting and export operations")
class FinancialReportController(
    private val reportService: FinancialReportService
) {
    
    @PostMapping("/export/csv")
    @PreAuthorize("hasAuthority('financial:export')")
    fun exportExpensesToCsv(
        @RequestBody request: ExpenseExportRequest
    ): ResponseEntity<ByteArray> {
        // CSV export endpoint
    }
    
    @PostMapping("/generate/pdf")
    @PreAuthorize("hasAuthority('financial:export')")  
    fun generatePdfReport(
        @RequestBody request: PdfReportRequest
    ): ResponseEntity<ByteArray> {
        // PDF generation endpoint
    }
    
    @PostMapping("/custom")
    @PreAuthorize("hasAuthority('financial:report')")
    fun createCustomReport(
        @RequestBody request: CustomReportRequest
    ): ResponseEntity<ReportExecutionDto> {
        // Custom report builder endpoint
    }
    
    @GetMapping("/templates")
    fun getReportTemplates(): ResponseEntity<List<ReportTemplateDto>> {
        // Available report templates
    }
    
    @PostMapping("/schedule")
    @PreAuthorize("hasAuthority('financial:schedule')")
    fun scheduleReport(
        @RequestBody request: ScheduleReportRequest
    ): ResponseEntity<FinancialReportDto> {
        // Schedule report execution
    }
    
    @GetMapping("/executions")
    fun getReportExecutions(
        @PageableDefault pageable: Pageable
    ): ResponseEntity<Page<ReportExecutionDto>> {
        // Report execution history
    }
}
```

### Frontend Implementation

#### 1. Report Builder Interface

```vue
<!-- /src/components/financial/ReportBuilder.vue -->
<template>
  <div class="report-builder">
    <Card>
      <CardHeader>
        <CardTitle>Financial Report Builder</CardTitle>
        <CardDescription>
          Create custom financial reports with flexible filtering and formatting
        </CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-6">
        <!-- Report Type Selection -->
        <FormField name="reportType">
          <FormLabel>Report Type</FormLabel>
          <FormSelect>
            <option value="EXPENSE_SUMMARY">Expense Summary</option>
            <option value="BILLABLE_HOURS">Billable Hours</option>
            <option value="MATTER_COSTS">Matter Costs</option>
            <option value="PER_DIEM_SUMMARY">Per-Diem Summary</option>
            <option value="CUSTOM">Custom Report</option>
          </FormSelect>
        </FormField>
        
        <!-- Date Range Filter -->
        <FormField name="dateRange">
          <FormLabel>Report Period</FormLabel>
          <FormDatePicker mode="range" />
        </FormField>
        
        <!-- Column Selection -->
        <ColumnSelector
          v-model="selectedColumns"
          :available-columns="availableColumns"
        />
        
        <!-- Export Format -->
        <FormField name="outputFormat">
          <FormLabel>Export Format</FormLabel>
          <div class="flex gap-2">
            <Button
              variant="outline"
              :class="{ 'bg-primary text-primary-foreground': format === 'PDF' }"
              @click="format = 'PDF'"
            >
              <FileText class="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              :class="{ 'bg-primary text-primary-foreground': format === 'CSV' }"
              @click="format = 'CSV'"
            >
              <FileSpreadsheet class="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              :class="{ 'bg-primary text-primary-foreground': format === 'EXCEL' }"
              @click="format = 'EXCEL'"
            >
              <FileSpreadsheet class="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </FormField>
        
        <!-- Advanced Filters -->
        <AdvancedFilters v-model="filters" />
        
        <!-- Schedule Options -->
        <ScheduleOptions v-model="scheduleConfig" />
      </CardContent>
      
      <CardFooter class="flex justify-between">
        <Button variant="outline" @click="previewReport">
          <Eye class="h-4 w-4 mr-2" />
          Preview
        </Button>
        <div class="flex gap-2">
          <Button @click="generateReport" :loading="generating">
            <Download class="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button v-if="scheduleConfig.enabled" @click="scheduleReport">
            <Clock class="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancialReports } from '~/composables/useFinancialReports'
import type { ReportBuilderForm } from '~/types/financial-reports'

const { generateReport, scheduleReport, availableColumns } = useFinancialReports()

const form = ref<ReportBuilderForm>({
  reportType: 'EXPENSE_SUMMARY',
  dateRange: { start: null, end: null },
  outputFormat: 'PDF',
  selectedColumns: [],
  filters: {},
  scheduleConfig: { enabled: false }
})

const generating = ref(false)
</script>
```

#### 2. Report Management Interface

```vue
<!-- /src/components/financial/ReportManager.vue -->
<template>
  <div class="report-manager">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Financial Reports</h2>
      <Button @click="showReportBuilder = true">
        <Plus class="h-4 w-4 mr-2" />
        New Report
      </Button>
    </div>
    
    <!-- Report Execution History -->
    <Card>
      <CardHeader>
        <CardTitle>Report History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="execution in reportExecutions" :key="execution.id">
              <TableCell>{{ execution.reportName }}</TableCell>
              <TableCell>
                <Badge>{{ execution.reportType }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(execution.status)">
                  {{ execution.status }}
                </Badge>
              </TableCell>
              <TableCell>{{ formatDate(execution.completedAt) }}</TableCell>
              <TableCell>{{ formatFileSize(execution.fileSizeBytes) }}</TableCell>
              <TableCell>
                <div class="flex gap-2">
                  <Button 
                    v-if="execution.status === 'COMPLETED'"
                    size="sm" 
                    variant="outline"
                    @click="downloadReport(execution.id)"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    @click="regenerateReport(execution.reportId)"
                  >
                    <RefreshCw class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    
    <!-- Report Builder Dialog -->
    <Dialog v-model:open="showReportBuilder">
      <DialogContent class="max-w-4xl">
        <ReportBuilder @close="showReportBuilder = false" />
      </DialogContent>
    </Dialog>
  </div>
</template>
```

#### 3. Composable for Report Operations

```typescript
// /src/composables/useFinancialReports.ts
export function useFinancialReports() {
  const { $fetch } = useNuxtApp()
  
  const generateReport = async (request: ReportRequest) => {
    const response = await $fetch('/api/financial/reports/generate', {
      method: 'POST',
      body: request
    })
    
    // Handle file download
    if (request.outputFormat === 'PDF') {
      downloadFile(response, `report-${Date.now()}.pdf`, 'application/pdf')
    } else if (request.outputFormat === 'CSV') {
      downloadFile(response, `report-${Date.now()}.csv`, 'text/csv')
    }
    
    return response
  }
  
  const scheduleReport = async (request: ScheduleReportRequest) => {
    return await $fetch('/api/financial/reports/schedule', {
      method: 'POST',
      body: request
    })
  }
  
  const getReportExecutions = async (page = 0, size = 20) => {
    return await $fetch('/api/financial/reports/executions', {
      params: { page, size }
    })
  }
  
  const downloadFile = (data: ArrayBuffer, filename: string, contentType: string) => {
    const blob = new Blob([data], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
  
  return {
    generateReport,
    scheduleReport,
    getReportExecutions,
    downloadFile
  }
}
```

## 📋 Implementation Notes

### CSV Export Implementation
- Use OpenCSV library for robust CSV generation
- Support configurable column selection and ordering
- Handle Japanese character encoding (UTF-8 with BOM)
- Implement streaming for large datasets to prevent memory issues

### PDF Generation Strategy
- Use iText 7 for PDF generation with professional layouts
- Create Thymeleaf templates for different report types
- Support company branding and Japanese localization
- Include charts and graphs using embedded SVG or chart libraries

### Report Scheduling System
- Leverage Spring Boot's `@Scheduled` annotation
- Store schedule configurations in JSONB format
- Support cron expressions for flexible scheduling
- Implement email delivery using Spring Boot Mail

### Background Job Processing
- Use Spring's `@Async` with configured TaskExecutor
- Implement job status tracking and progress monitoring
- Handle large dataset processing with pagination
- Provide real-time status updates via WebSocket or polling

### Security Considerations
- Implement proper authorization for report access
- Audit all report generation and export activities
- Sanitize user inputs in custom report filters
- Control file access and download permissions

## 🧪 Testing Strategy

### Unit Tests
- Test CSV generation with various data sets
- Validate PDF template rendering
- Test schedule parsing and execution logic
- Mock external dependencies (email, file system)

### Integration Tests
- End-to-end report generation workflows
- Database query performance with large datasets
- File generation and download processes
- Scheduled job execution in test environment

### Performance Tests
- Large dataset export performance
- Concurrent report generation handling
- Memory usage during PDF generation
- Database query optimization validation

## 📚 Dependencies and Libraries

### Backend Dependencies
```kotlin
// build.gradle.kts additions
dependencies {
    // PDF Generation
    implementation("com.itextpdf:itext7-core:7.2.5")
    implementation("org.xhtmlrenderer:flying-saucer-pdf-itext5:9.1.22")
    
    // Excel Export
    implementation("org.apache.poi:poi-ooxml:5.2.4")
    
    // CSV Handling
    implementation("com.opencsv:opencsv:5.8")
    
    // Template Engine
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    
    // Email Support (already included in build.gradle.kts)
    // implementation("org.springframework.boot:spring-boot-starter-mail")
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "@tanstack/vue-query": "^5.0.0",
    "file-saver": "^2.0.5",
    "chart.js": "^4.0.0",
    "vue-chartjs": "^5.0.0"
  }
}
```

## 🎯 Success Criteria

### Functional Requirements
- [ ] Users can export expense data to CSV with configurable columns
- [ ] System generates professional PDF reports with Japanese localization
- [ ] Custom report builder allows flexible report creation
- [ ] Scheduled reports execute automatically and deliver via email
- [ ] Report execution history provides audit trail and re-download capability

### Technical Requirements
- [ ] Large dataset exports complete within 60 seconds
- [ ] PDF reports render consistently across different browsers
- [ ] Background job processing handles concurrent report generation
- [ ] All report operations are properly audited and logged
- [ ] System supports Japanese language formatting and currency display

### User Experience
- [ ] Report builder interface is intuitive and requires minimal training
- [ ] Export operations provide clear progress indication
- [ ] Generated reports are formatted professionally for business use
- [ ] Users can easily schedule recurring reports with flexible timing options
- [ ] Report download and sharing workflows are seamless

This task implements comprehensive financial reporting capabilities that align with the existing audit export functionality while extending it with professional PDF generation, flexible CSV exports, and automated scheduling for regular business reporting needs.