# Aster Management Project Overview

## Project Purpose
**Aster Management** is a comprehensive legal case management system designed for small to medium-sized law firms (1-10 members) to achieve digital transformation (DX).

## Target Audience
- Small to medium-sized law firms in Japan
- Focus on digitizing and streamlining law firm operations

## Core Features (Implementation Priority)

### Phase 1 (Priority Implementation):
1. **Case Management (案件管理)** - Kanban and table-style progress visualization, status management
2. **Billing Management (請求管理)** - Simple expense input forms and statistics per office, lawyer, and case

### Phase 2 (Later Implementation):
1. **Client Management (顧客管理)** - Centralized client information management, contact history tracking
2. **Document Management (文書管理)** - Digital storage of contracts/documents, search functionality, VSCode-style document editing with template variable embedding

## Key Requirements
- **Multi-tenancy**: Tenant isolation for all data operations
- **Security**: Attorney-client privilege protection, audit logging for sensitive operations
- **Internationalization**: Support for Japanese and English (using i18n)
- **Row Level Security (RLS)**: For multi-tenancy in PostgreSQL

## Development Philosophy
- **Simple over Easy**: Prefer explicit, straightforward solutions over clever abstractions
- **Clean Architecture**: Follow Clean Architecture principles
- **Type Safety**: Never use `any` type in TypeScript production code