# DB-024: Database Performance Optimization

## Task Overview
**Sprint**: S01_M000_DATABASE_FOUNDATION  
**Milestone**: MILESTONE_000_DATABASE_FOUNDATION  
**Type**: Performance Enhancement  
**Priority**: High  
**Estimated Effort**: 4-5 days  
**Assignee**: Database Team  

## Task Description
Implement comprehensive database performance optimization to meet the legal practice management system's response time requirements. Focus on query optimization, strategic indexing, and performance monitoring for the existing schema (V017-V022).

## Performance Targets
- **API Response Time**: p95 < 200ms
- **Case List Loading**: < 300ms for 1000+ cases
- **Document Search**: < 500ms for 10k+ documents  
- **Financial Reports**: < 1s for monthly aggregations
- **Audit Queries**: < 2s for date range searches
- **Concurrent Users**: Support 50+ simultaneous users

## Technical Requirements

### Database Schema Enhancements
Create migration `V024__Performance_Optimization.sql` with optimizations:

#### 1. Strategic Index Creation

##### A. Multi-Tenant Aware Indexes
```sql
-- Tenant-scoped indexes for major queries
CREATE INDEX CONCURRENTLY idx_matters_tenant_status ON matters(tenant_id, status) 
    WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_matters_tenant_created ON matters(tenant_id, created_at DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_matters_tenant_priority ON matters(tenant_id, priority, created_at DESC) 
    WHERE deleted_at IS NULL;

-- Document search optimization
CREATE INDEX CONCURRENTLY idx_documents_tenant_type_created ON documents(tenant_id, document_type, created_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_documents_tenant_matter ON documents(tenant_id, matter_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Client search optimization  
CREATE INDEX CONCURRENTLY idx_clients_tenant_active ON clients(tenant_id, is_active, created_at DESC);
CREATE INDEX CONCURRENTLY idx_clients_tenant_type ON clients(tenant_id, client_type, is_active);
```

##### B. Full-Text Search Indexes
```sql
-- Japanese text search optimization
CREATE INDEX CONCURRENTLY idx_matters_fts ON matters USING GIN(
    (setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
     setweight(to_tsvector('simple', COALESCE(description, '')), 'B') ||
     setweight(to_tsvector('simple', COALESCE(case_number, '')), 'A'))
);

CREATE INDEX CONCURRENTLY idx_clients_fts ON clients USING GIN(
    (setweight(to_tsvector('simple', COALESCE(first_name || ' ' || last_name, company_name, '')), 'A') ||
     setweight(to_tsvector('simple', COALESCE(full_name_kanji, company_name_kanji, '')), 'A') ||
     setweight(to_tsvector('simple', COALESCE(primary_email, '')), 'B'))
);

CREATE INDEX CONCURRENTLY idx_documents_content_fts ON documents USING GIN(
    to_tsvector('simple', COALESCE(extracted_text, ''))
) WHERE extracted_text IS NOT NULL;
```

##### C. Time-Based Indexes
```sql
-- Audit log performance  
CREATE INDEX CONCURRENTLY idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_audit_logs_resource_date ON audit_logs(resource_type, resource_id, created_at DESC);

-- Financial data indexes
CREATE INDEX CONCURRENTLY idx_time_entries_billing ON time_entries(tenant_id, entry_date DESC, is_billable) 
    WHERE is_billable = TRUE;
CREATE INDEX CONCURRENTLY idx_invoices_tenant_date ON invoices(tenant_id, invoice_date DESC, status);
CREATE INDEX CONCURRENTLY idx_expenses_tenant_date ON expenses(tenant_id, expense_date DESC, billable);
```

##### D. Relationship Performance Indexes
```sql
-- Case assignment queries
CREATE INDEX CONCURRENTLY idx_case_assignments_user_active ON case_assignments(user_id, is_active, assignment_date DESC)
    WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_case_assignments_case_role ON case_assignments(case_id, role, is_active)
    WHERE is_active = TRUE;

-- Document permissions
CREATE INDEX CONCURRENTLY idx_document_permissions_user_active ON document_permissions(user_id, is_active, expires_at)
    WHERE is_active = TRUE;
```

#### 2. Query Optimization Functions

##### A. Optimized Case Loading Function
```sql
CREATE OR REPLACE FUNCTION get_case_list_optimized(
    p_tenant_id UUID,
    p_user_id UUID,
    p_status_filter VARCHAR(50) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    case_id UUID,
    case_number VARCHAR(100),
    title VARCHAR(500),
    status VARCHAR(50),
    priority VARCHAR(20),
    primary_client_name VARCHAR(500),
    assigned_lawyer VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.case_number,
        m.title,
        m.status,
        m.priority,
        COALESCE(c.company_name, c.first_name || ' ' || c.last_name) as client_name,
        ul.first_name || ' ' || ul.last_name as lawyer_name,
        m.created_at,
        GREATEST(m.updated_at, COALESCE(max_doc.last_doc, m.updated_at)) as last_activity
    FROM matters m
    LEFT JOIN case_clients cc ON m.id = cc.case_id AND cc.is_primary = TRUE
    LEFT JOIN clients c ON cc.client_id = c.id
    LEFT JOIN case_assignments ca ON m.id = ca.case_id AND ca.is_primary = TRUE AND ca.is_active = TRUE
    LEFT JOIN users ul ON ca.user_id = ul.id
    LEFT JOIN (
        SELECT matter_id, MAX(created_at) as last_doc
        FROM documents 
        WHERE tenant_id = p_tenant_id AND deleted_at IS NULL
        GROUP BY matter_id
    ) max_doc ON m.id = max_doc.matter_id
    WHERE m.tenant_id = p_tenant_id
    AND m.deleted_at IS NULL
    AND (p_status_filter IS NULL OR m.status = p_status_filter)
    ORDER BY m.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

##### B. Financial Dashboard Optimization
```sql
CREATE OR REPLACE FUNCTION get_financial_summary_optimized(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_billable_hours DECIMAL(10,2),
    total_billable_amount DECIMAL(12,2),
    total_invoiced DECIMAL(12,2),
    total_collected DECIMAL(12,2),
    outstanding_amount DECIMAL(12,2),
    unbilled_time_value DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH time_summary AS (
        SELECT 
            COALESCE(SUM(duration_minutes), 0) / 60.0 as billable_hours,
            COALESCE(SUM(billable_amount), 0) as billable_amount,
            COALESCE(SUM(billable_amount) FILTER (WHERE is_billed = FALSE), 0) as unbilled_amount
        FROM time_entries 
        WHERE tenant_id = p_tenant_id 
        AND entry_date BETWEEN p_start_date AND p_end_date
        AND is_billable = TRUE
    ),
    invoice_summary AS (
        SELECT 
            COALESCE(SUM(total_amount), 0) as invoiced,
            COALESCE(SUM(paid_amount), 0) as collected,
            COALESCE(SUM(total_amount - paid_amount), 0) as outstanding
        FROM invoices 
        WHERE tenant_id = p_tenant_id 
        AND invoice_date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        ts.billable_hours,
        ts.billable_amount,
        ins.invoiced,
        ins.collected,
        ins.outstanding,
        ts.unbilled_amount
    FROM time_summary ts, invoice_summary ins;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### 3. Materialized Views for Heavy Queries

##### A. Case Summary Materialized View
```sql
CREATE MATERIALIZED VIEW mv_case_summary AS
SELECT 
    m.id as case_id,
    m.tenant_id,
    m.case_number,
    m.title,
    m.status,
    m.priority,
    m.created_at,
    m.updated_at,
    
    -- Client information
    COALESCE(c.company_name, c.first_name || ' ' || c.last_name) as primary_client_name,
    c.client_type,
    
    -- Assignment information  
    u.first_name || ' ' || u.last_name as primary_lawyer_name,
    ca.assignment_date,
    
    -- Activity counts
    COALESCE(doc_counts.document_count, 0) as document_count,
    COALESCE(time_counts.time_entry_count, 0) as time_entry_count,
    COALESCE(exp_counts.expense_count, 0) as expense_count,
    
    -- Financial summary
    COALESCE(fin_summary.total_billable, 0) as total_billable_amount,
    COALESCE(fin_summary.total_expenses, 0) as total_expense_amount,
    
    -- Last activity
    GREATEST(
        m.updated_at,
        COALESCE(doc_counts.last_document, m.updated_at),
        COALESCE(time_counts.last_time_entry, m.updated_at)
    ) as last_activity_at

FROM matters m
LEFT JOIN case_clients cc ON m.id = cc.case_id AND cc.is_primary = TRUE
LEFT JOIN clients c ON cc.client_id = c.id
LEFT JOIN case_assignments ca ON m.id = ca.case_id AND ca.is_primary = TRUE AND ca.is_active = TRUE
LEFT JOIN users u ON ca.user_id = u.id
LEFT JOIN (
    SELECT 
        matter_id,
        COUNT(*) as document_count,
        MAX(created_at) as last_document
    FROM documents 
    WHERE deleted_at IS NULL
    GROUP BY matter_id
) doc_counts ON m.id = doc_counts.matter_id
LEFT JOIN (
    SELECT 
        case_id,
        COUNT(*) as time_entry_count,
        MAX(created_at) as last_time_entry
    FROM time_entries
    GROUP BY case_id
) time_counts ON m.id = time_counts.case_id
LEFT JOIN (
    SELECT 
        matter_id,
        COUNT(*) as expense_count
    FROM expenses
    GROUP BY matter_id
) exp_counts ON m.id = exp_counts.matter_id
LEFT JOIN (
    SELECT 
        te.case_id,
        SUM(te.billable_amount) as total_billable,
        SUM(e.amount) as total_expenses
    FROM time_entries te
    FULL OUTER JOIN expenses e ON te.case_id = e.matter_id
    WHERE te.is_billable = TRUE OR e.billable = TRUE
    GROUP BY te.case_id
) fin_summary ON m.id = fin_summary.case_id
WHERE m.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE INDEX idx_mv_case_summary_tenant_status ON mv_case_summary(tenant_id, status, last_activity_at DESC);
CREATE INDEX idx_mv_case_summary_tenant_created ON mv_case_summary(tenant_id, created_at DESC);
CREATE INDEX idx_mv_case_summary_client ON mv_case_summary(tenant_id, primary_client_name);
```

#### 4. Performance Monitoring Tables

##### A. Query Performance Tracking
```sql
CREATE TABLE query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    query_type VARCHAR(100) NOT NULL,
    query_hash VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    query_plan_hash VARCHAR(64),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID,
    
    CONSTRAINT fk_query_performance_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_query_performance_type_time ON query_performance_log(query_type, executed_at DESC);
CREATE INDEX idx_query_performance_tenant_time ON query_performance_log(tenant_id, executed_at DESC);
```

## Implementation Guidelines

### 1. Index Creation Strategy
- Use `CREATE INDEX CONCURRENTLY` to avoid blocking existing operations
- Monitor index usage with `pg_stat_user_indexes`
- Remove unused indexes after monitoring period
- Implement index maintenance procedures

### 2. Query Optimization Process
1. **Identify Slow Queries**: Use `pg_stat_statements` extension
2. **Analyze Execution Plans**: Use `EXPLAIN (ANALYZE, BUFFERS)` 
3. **Create Targeted Indexes**: Based on query patterns
4. **Test Performance Impact**: Before and after measurements
5. **Monitor Long-term**: Ensure consistent performance

### 3. Materialized View Management
- Refresh materialized views automatically using cron jobs
- Implement incremental refresh where possible
- Monitor view freshness and update frequency
- Provide fallback to base tables if views are stale

### 4. Connection Pool Optimization
```sql
-- Connection pool settings for HikariCP
-- In application.yml:
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
```

## Architecture Decision Records (ADRs) Referenced

### Technical Architecture Document
- Database layer performance requirements
- Multi-tenant query optimization strategies
- Legal domain specific query patterns

### Data Model Design V2
- Index strategy for UUID-based primary keys
- Audit table performance considerations  
- Soft delete pattern optimization

## Definition of Done

### Performance Benchmarks
- [ ] Case list loading: <300ms for 1000+ cases verified
- [ ] Document search: <500ms for 10k+ documents verified
- [ ] Financial dashboard: <1s load time verified
- [ ] API endpoints: p95 response time <200ms verified
- [ ] Concurrent user load: 50+ users supported

### Index Implementation
- [ ] All strategic indexes created without blocking operations
- [ ] Index usage monitored and verified effective
- [ ] Unused indexes identified and removed
- [ ] Index maintenance procedures documented

### Query Optimization
- [ ] Slow query identification system implemented
- [ ] Critical query execution plans optimized
- [ ] Performance regression prevention measures in place
- [ ] Query performance monitoring operational

### Materialized Views
- [ ] Case summary materialized view implemented and tested
- [ ] Automatic refresh schedule configured
- [ ] View freshness monitoring implemented
- [ ] Fallback to base tables tested

### Monitoring & Alerting
- [ ] Query performance logging operational
- [ ] Performance degradation alerts configured
- [ ] Database health monitoring dashboard created
- [ ] Capacity planning metrics collected

## Testing Requirements

### Performance Testing
- Load testing with realistic data volumes
- Concurrent user simulation (50+ users)
- Query performance regression testing
- Index effectiveness measurement

### Functional Testing
- Verify all existing functionality still works
- Confirm multi-tenant isolation maintained
- Test materialized view accuracy
- Validate query result consistency

### Monitoring Testing
- Alert system functionality verification
- Performance log accuracy testing
- Dashboard metric validation

## Dependencies

### Upstream Dependencies
- V017-V022: All existing database schema (Complete)
- PostgreSQL 15 with required extensions
- Application connection pool configuration

### Downstream Impact
- API response times significantly improved
- Frontend user experience enhanced
- Database capacity planning enabled
- Performance regression prevention operational

## Risk Mitigation

### Performance Risk
- **Risk**: New indexes consume excessive storage
- **Mitigation**: Monitor index size and usage, remove ineffective indexes

### Availability Risk
- **Risk**: Index creation blocks database operations
- **Mitigation**: Use `CONCURRENTLY` option for all index creation

### Data Consistency Risk
- **Risk**: Materialized views become stale
- **Mitigation**: Implement robust refresh scheduling and monitoring

## Deliverables

1. **Migration Script**: `V024__Performance_Optimization.sql`
2. **Performance Benchmark Report**: Before/after measurements
3. **Monitoring Dashboard**: Query performance and database health
4. **Index Maintenance Procedures**: Documentation and automation scripts
5. **Performance Tuning Guide**: For ongoing optimization

## Success Metrics

- **Response Time**: 90% of API calls under 200ms
- **Throughput**: Support 50+ concurrent users with <5% performance degradation
- **Resource Usage**: Database CPU usage <70% under normal load
- **Query Performance**: 95% of critical queries meet target response times
- **Monitoring Coverage**: 100% of performance-critical queries monitored

---

**Next Task**: DB-025_Search_Enhancement  
**Related ADRs**: Technical Architecture, Data Model Design V2  
**Sprint Goal Contribution**: Ensures legal practice system meets enterprise performance standards