-- Test table for Astar Management
CREATE TABLE IF NOT EXISTS test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO test_table (name, description) VALUES
('Test Item 1', 'This is a test item'),
('Test Item 2', 'Another test item'),
('Test Item 3', 'Yet another test item')
ON CONFLICT DO NOTHING;