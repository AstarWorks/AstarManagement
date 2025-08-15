# Expense Management Module

## Overview
The expense management module handles all expense-related functionality for the Astar Management system, including expense tracking, tag management, file attachments, and balance calculations.

## Architecture
This module follows Clean Architecture principles with clear separation of concerns:

### Layers

#### 1. Presentation Layer (`presentation/`)
- **Purpose**: Handle HTTP requests and responses
- **Components**:
  - Controllers: REST endpoints for expense operations
  - Request/Response DTOs: Data transfer objects for API communication
  - Exception handlers: Convert domain exceptions to HTTP responses

#### 2. Application Layer (`application/`)
- **Purpose**: Orchestrate use cases and manage transactions
- **Components**:
  - Services: Application services that implement use cases
  - DTOs: Internal data transfer objects
  - Mappers: Convert between domain entities and DTOs

#### 3. Domain Layer (`domain/`)
- **Purpose**: Core business logic and rules
- **Components**:
  - Models: Domain entities and value objects
  - Repository interfaces: Ports for data persistence
  - Services: Domain services for complex business logic

#### 4. Infrastructure Layer (`infrastructure/`)
- **Purpose**: Technical implementations and external integrations
- **Components**:
  - Persistence: JPA repository implementations
  - Storage: File storage implementations
  - Config: Module-specific configurations

## Configuration
Module-specific properties are configured in `application.properties`:
- `expense.module.enabled`: Enable/disable the module
- `expense.file.upload.max-size`: Maximum file upload size (default: 10MB)
- `expense.file.upload.allowed-types`: Allowed MIME types for uploads
- `expense.balance.calculation.enabled`: Enable balance calculations
- `expense.tag.max-per-expense`: Maximum tags per expense

## Dependencies
- Spring Boot Web
- Spring Data JPA
- Spring Validation
- PostgreSQL
- Flyway for migrations

## Testing Strategy
- Unit tests for domain logic
- Integration tests for repositories
- Controller tests for API endpoints
- End-to-end tests for complete workflows