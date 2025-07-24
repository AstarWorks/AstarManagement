-- V009__Create_spring_modulith_event_publication_table.sql
-- Create Spring Modulith event publication table

CREATE TABLE IF NOT EXISTS event_publication (
    id UUID PRIMARY KEY,
    listener_id VARCHAR(512) NOT NULL,
    event_type VARCHAR(512) NOT NULL,
    serialized_event TEXT NOT NULL,
    publication_date TIMESTAMP NOT NULL,
    completion_date TIMESTAMP NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_publication_completion_date ON event_publication(completion_date);
CREATE INDEX IF NOT EXISTS idx_event_publication_publication_date ON event_publication(publication_date);
CREATE INDEX IF NOT EXISTS idx_event_publication_listener_id ON event_publication(listener_id);