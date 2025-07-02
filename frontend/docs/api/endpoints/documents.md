# Document API Endpoints

The Document API provides endpoints for document upload, management, OCR processing, and version control.

## Base URL

All document endpoints are prefixed with: `/api/v1/documents`

## Endpoints

### List Documents

**GET** `/api/v1/documents`

Retrieves a paginated list of documents with filtering and search capabilities.

#### Query Parameters

```typescript
interface DocumentQueryParams {
  page?: number                    // Default: 0
  size?: number                    // Default: 20, Max: 100
  sort?: string                    // Format: "field,direction"
  search?: string                  // Search in title, content, tags
  matterId?: string               // Filter by matter
  category?: DocumentCategory[]    // Filter by categories
  status?: DocumentStatus[]        // Filter by status
  uploadedBy?: string             // Filter by uploader
  tags?: string[]                 // Filter by tags
  dateFrom?: string               // Upload date range start
  dateTo?: string                 // Upload date range end
  contentType?: string[]          // Filter by MIME types
  minSize?: number                // Min file size in bytes
  maxSize?: number                // Max file size in bytes
  hasOcr?: boolean                // Has OCR text
}
```

#### Response

```typescript
interface PaginatedDocumentResponse {
  content: Document[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
```

#### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/documents?matterId=123&category=CONTRACT,PLEADING&hasOcr=true" \
  -H "Authorization: Bearer <token>"
```

### Get Document by ID

**GET** `/api/v1/documents/{id}`

Retrieves detailed information about a specific document.

#### Path Parameters

- `id` (required): UUID of the document

#### Response

```typescript
interface DocumentDetailResponse extends Document {
  versions: DocumentVersion[]
  annotations: DocumentAnnotation[]
  shares: DocumentShare[]
  processingJobs: DocumentProcessingJob[]
  relatedDocuments: Document[]
}
```

### Upload Document

**POST** `/api/v1/documents`

Uploads a new document with automatic processing.

#### Request

Multipart form data with the following fields:

```typescript
interface UploadDocumentRequest {
  file: File                       // Required
  title?: string                   // Defaults to filename
  category: DocumentCategory       // Required
  matterId?: string               // Optional matter association
  tags?: string[]                 // Optional tags
  accessLevel?: AccessLevel       // Default: PRIVATE
  confidentialityLevel?: ConfidentialityLevel
  processOcr?: boolean            // Default: true for PDFs
  customMetadata?: string         // JSON string
}
```

#### Response

```typescript
interface DocumentUploadResponse {
  document: Document
  processingJobs: DocumentProcessingJob[]
  uploadUrl: string               // Direct download URL
  thumbnailUrl?: string           // Thumbnail if available
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8080/api/v1/documents" \
  -H "Authorization: Bearer <token>" \
  -F "file=@contract.pdf" \
  -F "title=Service Agreement" \
  -F "category=CONTRACT" \
  -F "matterId=456" \
  -F "tags[]=legal" \
  -F "tags[]=urgent" \
  -F "processOcr=true"
```

### Update Document

**PUT** `/api/v1/documents/{id}`

Updates document metadata.

#### Path Parameters

- `id` (required): UUID of the document

#### Request Body

```typescript
interface UpdateDocumentRequest {
  title?: string
  category?: DocumentCategory
  tags?: string[]
  accessLevel?: AccessLevel
  confidentialityLevel?: ConfidentialityLevel
  customMetadata?: Record<string, unknown>
}
```

### Delete Document

**DELETE** `/api/v1/documents/{id}`

Soft deletes a document. The document is retained but marked as deleted.

#### Path Parameters

- `id` (required): UUID of the document

#### Query Parameters

- `permanent`: Boolean - permanently delete (requires admin permission)

### Download Document

**GET** `/api/v1/documents/{id}/download`

Downloads the document file.

#### Path Parameters

- `id` (required): UUID of the document

#### Query Parameters

- `version`: Number - specific version to download (optional)
- `disposition`: 'inline' | 'attachment' - how to serve the file

#### Response

Binary file stream with appropriate content headers.

### View Document

**GET** `/api/v1/documents/{id}/view`

Returns a secure URL for viewing the document in the browser.

#### Response

```typescript
interface DocumentViewResponse {
  viewUrl: string
  expiresAt: string
  requiresAuth: boolean
}
```

## Batch Operations

### Batch Upload

**POST** `/api/v1/documents/batch`

Uploads multiple documents at once.

#### Request

Multipart form data with:

```typescript
interface BatchUploadRequest {
  files: File[]                    // Multiple files
  defaultCategory?: DocumentCategory
  defaultTags?: string[]
  matterId?: string
  processOcr?: boolean
  skipDuplicates?: boolean
}
```

#### Response

```typescript
interface BatchUploadResponse {
  totalFiles: number
  successCount: number
  failureCount: number
  duplicateCount: number
  documents: DocumentUploadResult[]
}
```

### Batch Update

**PATCH** `/api/v1/documents/batch`

Updates multiple documents at once.

#### Request Body

```typescript
interface BatchUpdateRequest {
  documentIds: string[]
  updates: {
    category?: DocumentCategory
    tags?: string[]
    accessLevel?: AccessLevel
    addTags?: string[]
    removeTags?: string[]
  }
}
```

### Batch Delete

**DELETE** `/api/v1/documents/batch`

Deletes multiple documents at once.

#### Request Body

```typescript
interface BatchDeleteRequest {
  documentIds: string[]
  permanent?: boolean
}
```

## Version Control

### List Versions

**GET** `/api/v1/documents/{id}/versions`

Lists all versions of a document.

#### Response

```typescript
interface DocumentVersionListResponse {
  versions: DocumentVersion[]
  currentVersion: number
}
```

### Upload New Version

**POST** `/api/v1/documents/{id}/versions`

Uploads a new version of an existing document.

#### Request

Multipart form data:

```typescript
interface UploadVersionRequest {
  file: File
  changelog?: string
  makeLatest?: boolean // Default: true
}
```

### Restore Version

**POST** `/api/v1/documents/{id}/versions/{version}/restore`

Restores a previous version as the current version.

## OCR and Processing

### Get OCR Status

**GET** `/api/v1/documents/{id}/ocr`

Gets OCR processing status and results.

#### Response

```typescript
interface OcrStatusResponse {
  status: OcrStatus
  progress?: number
  completedAt?: string
  extractedText?: string
  confidence?: number
  error?: string
}
```

### Trigger OCR

**POST** `/api/v1/documents/{id}/ocr`

Manually triggers OCR processing.

#### Request Body

```typescript
interface TriggerOcrRequest {
  language?: string     // ISO language code
  enhanceImage?: boolean
  forceReprocess?: boolean
}
```

### Get Processing Jobs

**GET** `/api/v1/documents/{id}/jobs`

Lists all processing jobs for a document.

#### Response

```typescript
interface ProcessingJobListResponse {
  jobs: DocumentProcessingJob[]
}
```

## Annotations

### List Annotations

**GET** `/api/v1/documents/{id}/annotations`

Lists all annotations on a document.

#### Query Parameters

- `page`: Page number for specific document page
- `type`: Filter by annotation type

### Create Annotation

**POST** `/api/v1/documents/{id}/annotations`

Creates a new annotation.

#### Request Body

```typescript
interface CreateAnnotationRequest {
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  type: AnnotationType
  content: string
  color?: string
}
```

### Update Annotation

**PUT** `/api/v1/documents/{id}/annotations/{annotationId}`

Updates an existing annotation.

### Delete Annotation

**DELETE** `/api/v1/documents/{id}/annotations/{annotationId}`

Deletes an annotation.

## Sharing

### Share Document

**POST** `/api/v1/documents/{id}/share`

Shares a document with users or creates a public link.

#### Request Body

```typescript
interface ShareDocumentRequest {
  userIds?: string[]
  permissions?: DocumentPermission[]
  expiresAt?: string
  createPublicLink?: boolean
  publicLinkExpiry?: string
}
```

#### Response

```typescript
interface ShareDocumentResponse {
  shares: DocumentShare[]
  publicLink?: {
    url: string
    expiresAt: string
  }
}
```

### Revoke Share

**DELETE** `/api/v1/documents/{id}/share/{userId}`

Revokes document access for a specific user.

### Get Public Link

**GET** `/api/v1/documents/{id}/public-link`

Gets or regenerates public sharing link.

## Templates

### List Templates

**GET** `/api/v1/documents/templates`

Lists available document templates.

#### Query Parameters

- `category`: Filter by category
- `search`: Search in name and description
- `isActive`: Filter active/inactive

### Generate from Template

**POST** `/api/v1/documents/templates/{templateId}/generate`

Generates a new document from a template.

#### Request Body

```typescript
interface GenerateDocumentRequest {
  matterId?: string
  fields: Record<string, unknown>
  outputFormat?: 'PDF' | 'DOCX'
  filename?: string
}
```

## Search

### Search Documents

**POST** `/api/v1/documents/search`

Advanced document search with full-text capabilities.

#### Request Body

```typescript
interface DocumentSearchRequest {
  query: string
  filters?: {
    matterId?: string
    category?: DocumentCategory[]
    dateRange?: DateRange
    contentType?: string[]
    tags?: string[]
  }
  includeContent?: boolean
  highlightMatches?: boolean
  page?: number
  size?: number
}
```

#### Response

```typescript
interface DocumentSearchResponse {
  results: DocumentSearchResult[]
  totalResults: number
  facets?: SearchFacet[]
  took: number
}
```

## Using Document API in Nuxt.js

### Document Composable

```typescript
// composables/api/useDocuments.ts
export const useDocuments = () => {
  const { $api } = useNuxtApp()
  
  const uploadDocument = async (formData: FormData) => {
    return await $api<DocumentUploadResponse>('/documents', {
      method: 'POST',
      body: formData
    })
  }
  
  const downloadDocument = async (id: string) => {
    const response = await $fetch(`/api/v1/documents/${id}/download`, {
      method: 'GET',
      responseType: 'blob'
    })
    
    // Create download link
    const url = URL.createObjectURL(response)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.pdf' // Get from response headers
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const searchDocuments = async (request: DocumentSearchRequest) => {
    return await $api<DocumentSearchResponse>('/documents/search', {
      method: 'POST',
      body: request
    })
  }
  
  return {
    uploadDocument,
    downloadDocument,
    searchDocuments
  }
}
```

### Document Upload Component

```vue
<script setup lang="ts">
const { uploadDocument } = useDocuments()
const { showToast } = useToast()

const handleFileUpload = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files?.length) return
  
  const formData = new FormData()
  formData.append('file', files[0])
  formData.append('category', 'CONTRACT')
  formData.append('processOcr', 'true')
  
  try {
    const response = await uploadDocument(formData)
    showToast('Document uploaded successfully', 'success')
  } catch (error) {
    showToast('Upload failed', 'error')
  }
}
</script>

<template>
  <div>
    <input 
      type="file" 
      accept=".pdf,.doc,.docx"
      @change="handleFileUpload"
    />
  </div>
</template>
```

## Error Handling

### 413 Payload Too Large

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum allowed size of 50MB"
  }
}
```

### 415 Unsupported Media Type

```json
{
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "File type not supported. Allowed types: PDF, DOC, DOCX, JPG, PNG"
  }
}
```

### 422 Unprocessable Entity

```json
{
  "error": {
    "code": "OCR_FAILED",
    "message": "Failed to process document for OCR",
    "details": {
      "reason": "Document quality too low"
    }
  }
}
```