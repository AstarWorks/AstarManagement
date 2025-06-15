---
task_id: T01_S01
sprint_sequence_id: S01
status: open
complexity: High
last_updated: 2025-06-15T07:48:00Z
---

# Task: Database Schema and Migrations for Core Entities

## Description

Create the foundational database schema for the AsterManagement system, focusing on the core entities required for legal case management. This task involves designing and implementing PostgreSQL database tables with proper constraints, indexes, and audit trails. The schema must support the core case management functionality, including matters (legal cases), status tracking, and audit history.

Based on the existing Spring Boot project structure, we need to establish:
- Core database entities using JPA/Hibernate
- Flyway migrations for schema versioning
- PostgreSQL-specific optimizations
- Audit table architecture
- Performance indexes

## Goal / Objectives

- Create a robust, scalable database schema that supports the MVP requirements
- Implement proper audit trails for all critical business data
- Establish migration patterns that can be safely deployed across environments
- Optimize database performance with appropriate indexing strategy
- Ensure data integrity through proper constraints and foreign key relationships

## Acceptance Criteria

- [ ] Database schema supports Matter CRUD operations (FR-010)
- [ ] Kanban board stage transitions with audit trail (FR-011)
- [ ] All tables have proper primary keys, constraints, and indexes
- [ ] Flyway migrations are created and tested
- [ ] Audit tables capture who/when/what for critical changes
- [ ] PostgreSQL full-text search capabilities enabled (ts_vector)
- [ ] Schema supports user roles and permissions (FR-002)
- [ ] Database performance indexes are optimized for expected query patterns
- [ ] All foreign key relationships are properly defined
- [ ] Schema follows Spring Boot/JPA naming conventions

## Subtasks

- [ ] Analyze existing Spring Boot project structure and database dependencies
- [ ] Design core entity relationships (Matter, User, Stage, Audit)
- [ ] Create JPA entity classes with proper annotations
- [ ] Implement Flyway migration scripts for initial schema
- [ ] Add PostgreSQL-specific configurations to application.properties
- [ ] Create database indexes for performance optimization
- [ ] Design and implement audit table architecture
- [ ] Add full-text search capabilities using PostgreSQL ts_vector
- [ ] Create base repository interfaces and audit infrastructure
- [ ] Write integration tests for database schema
- [ ] Document database schema and migration patterns

## Technical Guidance

### Existing Spring Boot Project Analysis

The project currently uses:
- **Spring Boot 3.5.0** with Kotlin
- **PostgreSQL** as the primary database (configured in build.gradle.kts)
- **Spring Data JPA** with Hibernate ORM 6.6.15
- **Spring Security** for authentication
- **Testcontainers** for database testing

Key dependencies already configured:
- `spring-boot-starter-data-jpa`
- `postgresql` runtime dependency  
- `hibernate-orm` plugin with enhancement enabled
- `kotlin-plugin-jpa` for entity generation

### Database Migration Patterns

Since no existing Flyway configuration was found, we need to:

1. **Add Flyway dependency** to build.gradle.kts:
   ```kotlin
   implementation("org.flywaydb:flyway-core")
   runtimeOnly("org.flywaydb:flyway-database-postgresql")
   ```

2. **Configure Flyway in application.properties**:
   ```properties
   spring.flyway.enabled=true
   spring.flyway.locations=classpath:db/migration
   spring.flyway.baseline-on-migrate=true
   ```

3. **Migration naming convention**: `V{version}__{description}.sql`
   - V001__Create_users_table.sql
   - V002__Create_matters_table.sql
   - V003__Create_matter_status_history_table.sql

### Schema Requirements from Requirements

Based on functional requirements analysis:

**Core Tables Needed:**
1. **users** - Authentication and role management (FR-001, FR-002)
2. **matters** - Legal cases/matter management (FR-010, FR-011)
3. **matter_status_history** - Audit trail for matter stage changes (FR-011)
4. **documents** - File management and OCR content (FR-020, FR-022)  
5. **memos** - Client and internal communications (FR-030)
6. **expenses** - Expense tracking (FR-031)

**Key Schema Features:**
- **Audit columns**: created_at, updated_at, created_by, updated_by
- **Full-text search**: ts_vector columns for searchable content
- **Status tracking**: Proper enums for matter stages
- **Role-based access**: User roles (Lawyer, Clerk, Client)

### Integration Points with Existing Setup

1. **JPA Entity Configuration**:
   - Use `@Entity` annotations (already configured in allOpen plugin)
   - Leverage Hibernate enhancements for association management
   - Place entities in `dev.ryuzu.astermanagement.domain` package

2. **Security Integration**:
   - User table must integrate with Spring Security's UserDetails
   - Role-based permissions align with existing OAuth2 client setup

3. **Testing Integration**:
   - Use existing Testcontainers PostgreSQL setup for integration tests
   - Leverage Spring Boot Test annotations

## Implementation Notes

### Step-by-Step Approach

1. **Project Configuration** (Priority: High)
   ```kotlin
   // Add to build.gradle.kts dependencies
   implementation("org.flywaydb:flyway-core")
   runtimeOnly("org.flywaydb:flyway-database-postgresql")
   ```

2. **Application Properties** (Priority: High)
   ```properties
   # Database Configuration
   spring.datasource.url=jdbc:postgresql://localhost:5432/astermanagement
   spring.datasource.username=${DB_USERNAME:astermanagement}
   spring.datasource.password=${DB_PASSWORD:password}
   spring.datasource.driver-class-name=org.postgresql.Driver
   
   # JPA Configuration
   spring.jpa.hibernate.ddl-auto=validate
   spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
   spring.jpa.show-sql=false
   spring.jpa.properties.hibernate.format_sql=true
   
   # Flyway Configuration
   spring.flyway.enabled=true
   spring.flyway.locations=classpath:db/migration
   spring.flyway.baseline-on-migrate=true
   ```

3. **Initial Migration Structure**:
   ```sql
   -- V001__Create_users_table.sql
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       username VARCHAR(255) NOT NULL UNIQUE,
       email VARCHAR(255) NOT NULL UNIQUE,
       role VARCHAR(50) NOT NULL CHECK (role IN ('LAWYER', 'CLERK', 'CLIENT')),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE INDEX idx_users_username ON users(username);
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_role ON users(role);
   ```

### Performance Considerations (Indexing)

**Critical Indexes for MVP:**
- **users**: username, email, role (for authentication/authorization)
- **matters**: client_id, status, created_by (for dashboard queries)  
- **matter_status_history**: matter_id, created_at (for audit trails)
- **documents**: matter_id, file_type (for document listings)
- **Full-text search**: GIN indexes on ts_vector columns

**Index Strategy:**
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_matters_client_status ON matters(client_id, status);
CREATE INDEX idx_matter_history_matter_date ON matter_status_history(matter_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_documents_fts ON documents USING GIN(search_vector);
CREATE INDEX idx_memos_fts ON memos USING GIN(search_vector);
```

### PostgreSQL-Specific Optimizations

1. **Use UUID for Primary Keys**: Better for distributed systems and security
2. **TIMESTAMP WITH TIME ZONE**: Proper timezone handling for international use
3. **CHECK Constraints**: Enforce business rules at database level
4. **Full-text Search**: Native PostgreSQL ts_vector for search functionality
5. **JSON Columns**: For storing metadata and flexible attributes

### Audit Table Design

**Pattern**: Shadow tables with triggers or Spring Data JPA Auditing

**Spring Data Auditing Approach** (Recommended):
```kotlin
@Entity
@EntityListeners(AuditingEntityListener::class)
class Matter {
    @CreatedDate
    lateinit var createdAt: LocalDateTime
    
    @LastModifiedDate
    lateinit var updatedAt: LocalDateTime
    
    @CreatedBy
    var createdBy: String? = null
    
    @LastModifiedBy
    var lastModifiedBy: String? = null
}
```

**Separate Audit Trail Table**:
```sql
CREATE TABLE matter_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID NOT NULL REFERENCES matters(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

## Output Log

*(This section is populated as work progresses on the task)*

[2025-06-15 07:48:00] Task created and ready for implementation