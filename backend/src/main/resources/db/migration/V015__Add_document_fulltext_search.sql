-- V015__Add_document_fulltext_search.sql
-- Add full-text search capabilities to documents table
-- Supports multi-language search (Japanese and English) with weighted results

-- Add search vector columns for different languages
ALTER TABLE documents ADD COLUMN search_vector tsvector;
ALTER TABLE documents ADD COLUMN search_vector_ja tsvector;
ALTER TABLE documents ADD COLUMN search_vector_en tsvector;

-- Create GIN indexes for full-text search performance
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_search_vector_ja ON documents USING GIN(search_vector_ja);
CREATE INDEX idx_documents_search_vector_en ON documents USING GIN(search_vector_en);

-- Create composite search vector update function
CREATE OR REPLACE FUNCTION update_document_search_vector() RETURNS trigger AS $$
BEGIN
    -- Update simple search vector (language-independent)
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.file_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.original_file_name, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.extracted_text, '')), 'C');
    
    -- Update Japanese search vector
    NEW.search_vector_ja := 
        setweight(to_tsvector('japanese', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('japanese', COALESCE(NEW.file_name, '')), 'A') ||
        setweight(to_tsvector('japanese', COALESCE(NEW.original_file_name, '')), 'B') ||
        setweight(to_tsvector('japanese', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('japanese', COALESCE(NEW.extracted_text, '')), 'C');
    
    -- Update English search vector
    NEW.search_vector_en := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.file_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.original_file_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'C');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vectors
CREATE TRIGGER update_document_search_vector_trigger
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

-- Helper function for multi-language document search
CREATE OR REPLACE FUNCTION search_documents_multilang(
    search_term TEXT,
    language_preference TEXT DEFAULT 'auto'
) RETURNS TABLE (
    document_id UUID,
    rank_score REAL,
    matching_language TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        -- Search in simple vector (always included)
        SELECT 
            d.id as document_id,
            ts_rank(d.search_vector, plainto_tsquery('simple', search_term)) as rank_score,
            'simple'::TEXT as matching_language
        FROM documents d
        WHERE d.search_vector @@ plainto_tsquery('simple', search_term)
        AND d.status != 'DELETED'
        
        UNION ALL
        
        -- Search in Japanese vector
        SELECT 
            d.id as document_id,
            ts_rank(d.search_vector_ja, plainto_tsquery('japanese', search_term)) as rank_score,
            'japanese'::TEXT as matching_language
        FROM documents d
        WHERE d.search_vector_ja @@ plainto_tsquery('japanese', search_term)
        AND d.status != 'DELETED'
        AND (language_preference = 'auto' OR language_preference = 'japanese')
        
        UNION ALL
        
        -- Search in English vector
        SELECT 
            d.id as document_id,
            ts_rank(d.search_vector_en, plainto_tsquery('english', search_term)) as rank_score,
            'english'::TEXT as matching_language
        FROM documents d
        WHERE d.search_vector_en @@ plainto_tsquery('english', search_term)
        AND d.status != 'DELETED'
        AND (language_preference = 'auto' OR language_preference = 'english')
    )
    SELECT DISTINCT ON (sr.document_id)
        sr.document_id,
        sr.rank_score,
        sr.matching_language
    FROM search_results sr
    ORDER BY sr.document_id, sr.rank_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions based on document content
CREATE OR REPLACE FUNCTION get_document_search_suggestions(
    partial_term TEXT,
    max_suggestions INTEGER DEFAULT 10
) RETURNS TABLE (
    suggestion TEXT,
    frequency BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        word as suggestion,
        nentry as frequency
    FROM (
        SELECT 
            unnest(to_tsvector('simple', 
                string_agg(COALESCE(title, '') || ' ' || 
                          COALESCE(file_name, '') || ' ' || 
                          COALESCE(description, ''), ' ')
            )) as word
        FROM documents 
        WHERE status != 'DELETED'
    ) words
    WHERE word LIKE partial_term || '%'
    ORDER BY nentry DESC, word
    LIMIT max_suggestions;
END;
$$ LANGUAGE plpgsql;

-- Update existing documents to populate search vectors
UPDATE documents SET updated_at = updated_at WHERE id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN documents.search_vector IS 'Full-text search vector using simple dictionary (language-independent)';
COMMENT ON COLUMN documents.search_vector_ja IS 'Full-text search vector using Japanese dictionary';
COMMENT ON COLUMN documents.search_vector_en IS 'Full-text search vector using English dictionary';
COMMENT ON FUNCTION update_document_search_vector() IS 'Trigger function to maintain document search vectors';
COMMENT ON FUNCTION search_documents_multilang(TEXT, TEXT) IS 'Multi-language document search with ranking';
COMMENT ON FUNCTION get_document_search_suggestions(TEXT, INTEGER) IS 'Get search term suggestions based on document content';