# Auto-Generated API Types

This directory contains TypeScript types and Zod schemas automatically generated from the backend OpenAPI specification.

## ⚠️ Important

**DO NOT EDIT FILES IN THIS DIRECTORY MANUALLY**

All files in this directory are automatically generated from the backend OpenAPI specification and will be overwritten.

## Directory Structure

```
generated/
├── schemas/     # Zod validation schemas
├── types/       # TypeScript type definitions  
└── clients/     # Typed API clients
```

## Generation Process

Types are generated using:
- Source: Backend Spring Boot OpenAPI specification (`/api-docs`)
- Tool: `openapi-zod-client`
- Trigger: Manual or CI/CD pipeline

## Usage

```typescript
// Import generated types
import type { TableCreateRequest } from '~/shared/api/generated/types/table'

// Import generated Zod schemas
import { TableCreateRequestSchema } from '~/shared/api/generated/schemas/table'

// Use in components/composables
const validated = TableCreateRequestSchema.parse(formData)
```

## Regeneration

To regenerate types after backend changes:

```bash
npm run generate:types
```