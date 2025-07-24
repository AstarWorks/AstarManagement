-- Performance testing database initialization script

-- Ensure we're in the right database
\c astermanagement_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Create performance test specific schema
CREATE SCHEMA IF NOT EXISTS performance_tests;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA performance_tests TO testuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA performance_tests TO testuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA performance_tests TO testuser;

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_tests.test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL, -- baseline, load, stress, spike
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
    virtual_users INTEGER,
    duration_seconds INTEGER,
    total_requests INTEGER,
    failed_requests INTEGER,
    avg_response_time_ms DECIMAL(10,2),
    p95_response_time_ms DECIMAL(10,2),
    p99_response_time_ms DECIMAL(10,2),
    throughput_rps DECIMAL(10,2),
    created_by VARCHAR(100) DEFAULT 'k6-test',
    notes TEXT
);

-- Create test data tracking table
CREATE TABLE IF NOT EXISTS performance_tests.test_data_cleanup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_run_id UUID REFERENCES performance_tests.test_runs(id),
    entity_type VARCHAR(50) NOT NULL, -- matter, user, document, etc.
    entity_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    cleaned_up_at TIMESTAMP,
    cleanup_status VARCHAR(20) DEFAULT 'pending' -- pending, completed, failed
);

-- Insert baseline test users if they don't exist
INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at) 
VALUES 
    (uuid_generate_v4(), 'test.lawyer@example.com', '$2a$10$example_hash_for_TestPassword123!', 'Test', 'Lawyer', 'LAWYER', NOW(), NOW()),
    (uuid_generate_v4(), 'test.clerk@example.com', '$2a$10$example_hash_for_TestPassword123!', 'Test', 'Clerk', 'CLERK', NOW(), NOW()),
    (uuid_generate_v4(), 'test.client@example.com', '$2a$10$example_hash_for_TestPassword123!', 'Test', 'Client', 'CLIENT', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance testing queries
CREATE INDEX IF NOT EXISTS idx_matters_perf_test ON matters(status, priority, updated_at) WHERE title LIKE 'Performance Test%' OR title LIKE 'Load Test%' OR title LIKE 'Stress Test%';
CREATE INDEX IF NOT EXISTS idx_test_runs_started_at ON performance_tests.test_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_data_cleanup_status ON performance_tests.test_data_cleanup(cleanup_status, entity_type);

-- Create performance monitoring views
CREATE OR REPLACE VIEW performance_tests.latest_test_results AS
SELECT 
    test_name,
    test_type,
    started_at,
    ended_at,
    (ended_at - started_at) as actual_duration,
    virtual_users,
    total_requests,
    failed_requests,
    ROUND((failed_requests::decimal / NULLIF(total_requests, 0)) * 100, 2) as failure_rate_percent,
    avg_response_time_ms,
    p95_response_time_ms,
    p99_response_time_ms,
    throughput_rps
FROM performance_tests.test_runs 
WHERE status = 'completed'
ORDER BY started_at DESC 
LIMIT 10;

-- Grant view permissions
GRANT SELECT ON performance_tests.latest_test_results TO testuser;

-- Function to start a new test run
CREATE OR REPLACE FUNCTION performance_tests.start_test_run(
    p_test_name VARCHAR(100),
    p_test_type VARCHAR(50),
    p_virtual_users INTEGER DEFAULT 1,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    test_run_id UUID;
BEGIN
    INSERT INTO performance_tests.test_runs (
        test_name, test_type, virtual_users, notes
    ) VALUES (
        p_test_name, p_test_type, p_virtual_users, p_notes
    ) RETURNING id INTO test_run_id;
    
    RETURN test_run_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a test run
CREATE OR REPLACE FUNCTION performance_tests.complete_test_run(
    p_test_run_id UUID,
    p_total_requests INTEGER,
    p_failed_requests INTEGER,
    p_avg_response_time_ms DECIMAL(10,2),
    p_p95_response_time_ms DECIMAL(10,2),
    p_p99_response_time_ms DECIMAL(10,2),
    p_throughput_rps DECIMAL(10,2)
) RETURNS VOID AS $$
BEGIN
    UPDATE performance_tests.test_runs SET
        ended_at = NOW(),
        status = 'completed',
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
        total_requests = p_total_requests,
        failed_requests = p_failed_requests,
        avg_response_time_ms = p_avg_response_time_ms,
        p95_response_time_ms = p_p95_response_time_ms,
        p99_response_time_ms = p_p99_response_time_ms,
        throughput_rps = p_throughput_rps
    WHERE id = p_test_run_id;
END;
$$ LANGUAGE plpgsql;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION performance_tests.start_test_run TO testuser;
GRANT EXECUTE ON FUNCTION performance_tests.complete_test_run TO testuser;

-- Insert sample performance benchmark data for comparison
INSERT INTO performance_tests.test_runs (
    test_name, test_type, started_at, ended_at, status, virtual_users,
    duration_seconds, total_requests, failed_requests, avg_response_time_ms,
    p95_response_time_ms, p99_response_time_ms, throughput_rps, notes
) VALUES 
    ('Baseline Benchmark', 'baseline', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 seconds', 'completed', 1, 30, 150, 0, 45.5, 85.2, 125.7, 5.0, 'Initial baseline benchmark'),
    ('Target Performance', 'baseline', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '30 seconds', 'completed', 1, 30, 200, 1, 38.2, 78.1, 110.5, 6.67, 'Target performance metrics')
ON CONFLICT DO NOTHING;

COMMIT;