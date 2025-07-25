# DB-025: Search Enhancement with Japanese Language Support

## Task Overview
**Sprint**: S01_M000_DATABASE_FOUNDATION  
**Milestone**: MILESTONE_000_DATABASE_FOUNDATION  
**Type**: Feature Enhancement  
**Priority**: High  
**Estimated Effort**: 3-4 days  
**Assignee**: Database Team  

## Task Description
Implement comprehensive search functionality with full-text search capabilities optimized for Japanese legal documents and client data. This includes advanced search features, Japanese language processing, and search result ranking for legal practice management.

## Search Requirements

### Performance Targets
- **Document Content Search**: <500ms for 10k+ documents
- **Client/Case Search**: <200ms response time
- **Complex Multi-field Search**: <1s for combined queries
- **Search Result Relevance**: >85% accuracy for legal term searches
- **Japanese Text Processing**: Support kanji, hiragana, katakana, and romaji

## Technical Requirements

### Database Schema Enhancements
Create migration `V025__Search_Enhancement.sql` with advanced search capabilities:

#### 1. Enhanced Full-Text Search Configuration

##### A. Japanese Language Search Configuration
```sql
-- Create custom Japanese text search configuration
CREATE TEXT SEARCH CONFIGURATION japanese_legal (COPY = simple);

-- Create specialized dictionary for legal terms
CREATE TEXT SEARCH DICTIONARY japanese_legal_dict (
    TEMPLATE = simple,
    STOPWORDS = japanese_legal_stopwords
);

-- Configure the search configuration
ALTER TEXT SEARCH CONFIGURATION japanese_legal
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
    WITH japanese_legal_dict, simple;
```

##### B. Search-Optimized Columns and Indexes
```sql
-- Add search vectors to existing tables
ALTER TABLE matters ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_search_vector tsvector;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata_search_vector tsvector;

-- Create GIN indexes for fast text search
CREATE INDEX CONCURRENTLY idx_matters_search_vector ON matters USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_clients_search_vector ON clients USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_documents_content_search ON documents USING GIN(content_search_vector);
CREATE INDEX CONCURRENTLY idx_documents_metadata_search ON documents USING GIN(metadata_search_vector);

-- Composite search index for multi-field queries
CREATE INDEX CONCURRENTLY idx_matters_composite_search ON matters USING GIN(
    (search_vector || to_tsvector('japanese_legal', COALESCE(case_number, '')))
);
```

#### 2. Advanced Search Tables

##### A. Search Terms and Synonyms
```sql
CREATE TABLE search_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    term VARCHAR(255) NOT NULL,
    normalized_term VARCHAR(255) NOT NULL,
    term_type VARCHAR(50) NOT NULL CHECK (
        term_type IN ('legal_term', 'case_type', 'document_type', 'client_name', 'general')
    ),
    language VARCHAR(10) DEFAULT 'ja',
    usage_count INTEGER DEFAULT 0,
    boost_factor DECIMAL(5,2) DEFAULT 1.0, -- Search result boosting
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_search_terms_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_search_term_tenant UNIQUE (tenant_id, normalized_term)
);

-- Search term synonyms for expanded matching
CREATE TABLE search_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    primary_term_id UUID NOT NULL,
    synonym_term VARCHAR(255) NOT NULL,
    synonym_type VARCHAR(50) DEFAULT 'exact', -- 'exact', 'similar', 'abbreviation'
    confidence_score DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_search_synonyms_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_search_synonyms_primary_term FOREIGN KEY (primary_term_id) REFERENCES search_terms(id) ON DELETE CASCADE
);
```

##### B. Search History and Analytics
```sql
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Query information
    query_text TEXT NOT NULL,
    normalized_query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL CHECK (
        search_type IN ('case_search', 'client_search', 'document_search', 'global_search', 'advanced_search')
    ),
    search_filters JSONB DEFAULT '{}',
    
    -- Results and performance
    results_count INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER NOT NULL,
    result_quality_score DECIMAL(5,2), -- User feedback on result relevance
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_search_queries_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_search_queries_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_search_queries_tenant_date ON search_queries(tenant_id, created_at DESC);
CREATE INDEX idx_search_queries_user_date ON search_queries(user_id, created_at DESC);
CREATE INDEX idx_search_queries_text_gin ON search_queries USING GIN(to_tsvector('japanese_legal', query_text));
```

#### 3. Search Result Ranking System

##### A. Content Relevance Scoring
```sql
CREATE TABLE search_relevance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Rule definition
    rule_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL, -- 'case', 'client', 'document'
    field_name VARCHAR(100) NOT NULL,
    boost_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    
    -- Conditions
    match_type VARCHAR(50) NOT NULL CHECK (
        match_type IN ('exact', 'prefix', 'fuzzy', 'phrase', 'proximity')
    ),
    rule_conditions JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_search_relevance_rules_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_search_rule_name_tenant UNIQUE (tenant_id, rule_name)
);
```

#### 4. Advanced Search Functions

##### A. Comprehensive Search Function
```sql
CREATE OR REPLACE FUNCTION search_comprehensive(
    p_tenant_id UUID,
    p_user_id UUID,
    p_query_text TEXT,
    p_search_type VARCHAR(50) DEFAULT 'global_search',
    p_filters JSONB DEFAULT '{}',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    result_type VARCHAR(50),
    result_id UUID,
    title TEXT,
    excerpt TEXT,
    relevance_score DECIMAL(10,4),
    match_context JSONB,
    result_url TEXT
) AS $$
DECLARE
    normalized_query TEXT;
    search_tsquery tsquery;
BEGIN
    -- Normalize and prepare search query
    normalized_query := LOWER(TRIM(p_query_text));
    search_tsquery := plainto_tsquery('japanese_legal', normalized_query);
    
    -- Record search query for analytics
    INSERT INTO search_queries (tenant_id, user_id, query_text, normalized_query, search_type, search_filters, results_count, execution_time_ms)
    VALUES (p_tenant_id, p_user_id, p_query_text, normalized_query, p_search_type, p_filters, 0, 0);
    
    -- Return combined results from all search types
    RETURN QUERY
    (
        -- Case search results
        SELECT 
            'case'::VARCHAR(50) as result_type,
            m.id as result_id,
            m.title as title,
            SUBSTRING(m.description, 1, 200) as excerpt,
            (ts_rank_cd(m.search_vector, search_tsquery) * 
             CASE WHEN m.case_number ILIKE '%' || normalized_query || '%' THEN 2.0 ELSE 1.0 END) as relevance_score,
            json_build_object(
                'case_number', m.case_number,
                'status', m.status,
                'priority', m.priority,
                'client_name', COALESCE(c.company_name, c.first_name || ' ' || c.last_name)
            ) as match_context,
            '/cases/' || m.id::TEXT as result_url
        FROM matters m
        LEFT JOIN case_clients cc ON m.id = cc.case_id AND cc.is_primary = TRUE
        LEFT JOIN clients c ON cc.client_id = c.id
        WHERE m.tenant_id = p_tenant_id
        AND m.deleted_at IS NULL
        AND (p_search_type = 'global_search' OR p_search_type = 'case_search')
        AND (
            m.search_vector @@ search_tsquery
            OR m.case_number ILIKE '%' || normalized_query || '%'
            OR m.title ILIKE '%' || normalized_query || '%'
        )
    )
    UNION ALL
    (
        -- Client search results
        SELECT 
            'client'::VARCHAR(50) as result_type,
            cl.id as result_id,
            COALESCE(cl.company_name, cl.first_name || ' ' || cl.last_name) as title,
            COALESCE(cl.primary_email, cl.primary_phone, '') as excerpt,
            (ts_rank_cd(cl.search_vector, search_tsquery) * 
             CASE WHEN cl.primary_email = normalized_query THEN 3.0 ELSE 1.0 END) as relevance_score,
            json_build_object(
                'client_type', cl.client_type,
                'email', cl.primary_email, 
                'phone', cl.primary_phone,
                'is_active', cl.is_active
            ) as match_context,
            '/clients/' || cl.id::TEXT as result_url
        FROM clients cl
        WHERE cl.tenant_id = p_tenant_id
        AND cl.is_active = TRUE
        AND (p_search_type = 'global_search' OR p_search_type = 'client_search')
        AND (
            cl.search_vector @@ search_tsquery
            OR cl.primary_email ILIKE '%' || normalized_query || '%'
            OR cl.primary_phone LIKE '%' || normalized_query || '%'
        )
    )
    UNION ALL
    (
        -- Document search results
        SELECT 
            'document'::VARCHAR(50) as result_type,
            d.id as result_id,
            d.filename as title,
            SUBSTRING(d.extracted_text, 1, 200) as excerpt,
            (ts_rank_cd(d.content_search_vector, search_tsquery) * 1.5 + 
             ts_rank_cd(d.metadata_search_vector, search_tsquery) * 0.5) as relevance_score,
            json_build_object(
                'document_type', d.document_type,
                'file_size', d.file_size,
                'case_id', d.matter_id,
                'confidentiality_level', d.confidentiality_level
            ) as match_context,
            '/documents/' || d.id::TEXT as result_url
        FROM documents d
        WHERE d.tenant_id = p_tenant_id
        AND d.deleted_at IS NULL
        AND (p_search_type = 'global_search' OR p_search_type = 'document_search')
        AND (
            d.content_search_vector @@ search_tsquery
            OR d.metadata_search_vector @@ search_tsquery
            OR d.filename ILIKE '%' || normalized_query || '%'
        )
    )
    ORDER BY relevance_score DESC, title
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

##### B. Japanese Text Processing Function
```sql
CREATE OR REPLACE FUNCTION normalize_japanese_text(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized_text TEXT;
BEGIN
    -- Basic Japanese text normalization
    normalized_text := LOWER(TRIM(input_text));
    
    -- Convert full-width characters to half-width
    normalized_text := TRANSLATE(normalized_text, 
        '０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ',
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    
    -- Remove excessive whitespace
    normalized_text := REGEXP_REPLACE(normalized_text, '\s+', ' ', 'g');
    
    RETURN normalized_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### 5. Search Vector Update Triggers

##### A. Automatic Search Vector Updates
```sql
-- Update search vectors for matters
CREATE OR REPLACE FUNCTION update_matters_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.case_number, '')), 'A') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.status, '')), 'C') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.priority, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matters_search_vector_trigger
    BEFORE INSERT OR UPDATE ON matters
    FOR EACH ROW
    EXECUTE FUNCTION update_matters_search_vector();

-- Update search vectors for clients
CREATE OR REPLACE FUNCTION update_clients_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.company_name, '')), 'A') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.full_name_kanji, NEW.company_name_kanji, '')), 'A') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.full_name_kana, NEW.company_name_kana, '')), 'B') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.primary_email, '')), 'C') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.primary_phone, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_search_vector_trigger
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_search_vector();

-- Update search vectors for documents
CREATE OR REPLACE FUNCTION update_documents_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_search_vector := to_tsvector('japanese_legal', COALESCE(NEW.extracted_text, ''));
    NEW.metadata_search_vector := 
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.filename, '')), 'A') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.document_type, '')), 'B') ||
        setweight(to_tsvector('japanese_legal', COALESCE(NEW.tags::TEXT, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_search_vector_trigger
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_search_vector();
```

## Implementation Guidelines

### 1. Japanese Language Processing
- **Multi-script Support**: Handle kanji, hiragana, katakana, and romaji
- **Character Normalization**: Convert full-width to half-width characters
- **Legal Term Dictionary**: Build specialized dictionary for Japanese legal terms
- **Fuzzy Matching**: Implement similarity scoring for Japanese text

### 2. Search Performance Optimization
- **Index Management**: Monitor and optimize GIN indexes for search performance
- **Query Caching**: Implement search result caching for frequently accessed queries
- **Pagination**: Efficient result pagination for large result sets
- **Result Ranking**: Implement relevance scoring based on legal document importance

### 3. Search Analytics and Improvement
- **Query Analysis**: Track search patterns and unsuccessful queries
- **Result Quality**: Monitor click-through rates and user feedback
- **Search Suggestions**: Implement auto-complete and query suggestions
- **Performance Monitoring**: Track search response times and optimization opportunities

## Architecture Decision Records (ADRs) Referenced

### Technical Architecture Document
- Full-text search requirements for legal documents
- Japanese language processing specifications
- Search performance requirements

### Data Model Design V2
- Search vector integration with existing schema
- Multi-tenant search isolation requirements

## Definition of Done

### Search Functionality
- [ ] Full-text search working across cases, clients, and documents
- [ ] Japanese language processing implemented and tested
- [ ] Advanced search with filters functional
- [ ] Search result ranking by relevance implemented
- [ ] Multi-field search capabilities working

### Performance Requirements
- [ ] Document search <500ms for 10k+ documents verified
- [ ] Client/case search <200ms response time verified
- [ ] Complex queries <1s response time verified
- [ ] Search indexes optimized and monitored
- [ ] Concurrent search performance tested

### Japanese Language Support
- [ ] Kanji, hiragana, katakana search working
- [ ] Character normalization implemented
- [ ] Legal term dictionary integrated
- [ ] Mixed script queries handled correctly
- [ ] Text extraction from documents working

### Search Analytics
- [ ] Search query logging operational
- [ ] Performance metrics collection working
- [ ] Search quality scoring implemented
- [ ] Popular search terms tracking functional
- [ ] Search failure analysis available

### Multi-tenant Compliance
- [ ] Search results properly isolated by tenant
- [ ] Search indexes include tenant context
- [ ] Cross-tenant search prevention verified
- [ ] RLS policies applied to search tables

## Testing Requirements

### Functional Testing
- Search accuracy testing with legal documents
- Japanese text search verification
- Multi-criteria search testing
- Search result pagination testing

### Performance Testing
- Load testing with large document collections
- Concurrent search user simulation
- Search index performance monitoring
- Query optimization verification

### Language Testing  
- Japanese character set coverage testing
- Legal terminology search accuracy
- Mixed language query handling
- OCR text search quality verification

## Dependencies

### Upstream Dependencies
- V017-V022: Complete database schema (Complete)
- V024: Performance optimization indexes (Depends on)
- PostgreSQL text search extensions
- Japanese language processing requirements

### Downstream Impact
- Frontend search interfaces enhanced
- API search endpoints improved
- Document processing system integration
- Analytics and reporting capabilities expanded

## Risk Mitigation

### Performance Risk
- **Risk**: Large document collections slow search performance
- **Mitigation**: Implement search result pagination and index optimization

### Language Processing Risk
- **Risk**: Japanese text processing accuracy issues
- **Mitigation**: Extensive testing with real legal documents and terminology

### Storage Risk
- **Risk**: Search indexes consume excessive storage space
- **Mitigation**: Monitor index size and implement cleanup procedures

## Deliverables

1. **Migration Script**: `V025__Search_Enhancement.sql`
2. **Japanese Legal Terms Dictionary**: Legal terminology for search optimization
3. **Search Performance Benchmarks**: Response time measurements
4. **Search Analytics Dashboard**: Query patterns and performance metrics
5. **Search API Documentation**: Comprehensive search functionality guide

## Success Metrics

- **Search Performance**: 95% of searches under target response times
- **Search Accuracy**: >85% user satisfaction with search results
- **Language Support**: 100% coverage of Japanese character sets
- **Search Adoption**: 80% of users actively using search features
- **System Performance**: <10% impact on overall database performance

---

**Next Task**: DB-026_Communication_Tables  
**Related ADRs**: Technical Architecture, Data Model Design V2  
**Sprint Goal Contribution**: Enables powerful search capabilities essential for legal practice efficiency