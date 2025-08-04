-- Create test_table for connection testing
CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE test_table ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read
CREATE POLICY "Enable read access for all users" ON test_table
    FOR SELECT USING (true);

-- Insert test data
INSERT INTO test_table (name) VALUES ('Test Connection');