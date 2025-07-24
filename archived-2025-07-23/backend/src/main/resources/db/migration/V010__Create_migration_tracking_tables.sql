-- Migration tracking table for React to Vue conversion
CREATE TABLE IF NOT EXISTS migration_status (
    id SERIAL PRIMARY KEY,
    component_path VARCHAR(500) NOT NULL UNIQUE,
    react_loc INTEGER NOT NULL DEFAULT 0,
    vue_loc INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'migrated', 'verified')),
    migrated_at TIMESTAMP,
    migrated_by VARCHAR(100),
    verified_at TIMESTAMP,
    verified_by VARCHAR(100),
    test_coverage DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_migration_status_status ON migration_status(status);
CREATE INDEX idx_migration_status_path ON migration_status(component_path);
CREATE INDEX idx_migration_status_migrated_at ON migration_status(migrated_at);

-- Migration metrics table
CREATE TABLE IF NOT EXISTS migration_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_components INTEGER NOT NULL DEFAULT 0,
    pending_components INTEGER NOT NULL DEFAULT 0,
    in_progress_components INTEGER NOT NULL DEFAULT 0,
    migrated_components INTEGER NOT NULL DEFAULT 0,
    verified_components INTEGER NOT NULL DEFAULT 0,
    total_react_loc INTEGER NOT NULL DEFAULT 0,
    total_vue_loc INTEGER NOT NULL DEFAULT 0,
    average_test_coverage DECIMAL(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on date
CREATE UNIQUE INDEX idx_migration_metrics_date ON migration_metrics(date);

-- Migration issues table
CREATE TABLE IF NOT EXISTS migration_issues (
    id SERIAL PRIMARY KEY,
    component_path VARCHAR(500) NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    suggested_fix TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (component_path) REFERENCES migration_status(component_path)
);

-- Create indexes for issues
CREATE INDEX idx_migration_issues_component ON migration_issues(component_path);
CREATE INDEX idx_migration_issues_resolved ON migration_issues(resolved);
CREATE INDEX idx_migration_issues_severity ON migration_issues(severity);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_migration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER migration_status_updated_at
    BEFORE UPDATE ON migration_status
    FOR EACH ROW
    EXECUTE FUNCTION update_migration_updated_at();

-- Function to calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_migration_metrics()
RETURNS VOID AS $$
BEGIN
    INSERT INTO migration_metrics (
        date,
        total_components,
        pending_components,
        in_progress_components,
        migrated_components,
        verified_components,
        total_react_loc,
        total_vue_loc,
        average_test_coverage
    )
    SELECT
        CURRENT_DATE,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'in_progress'),
        COUNT(*) FILTER (WHERE status = 'migrated'),
        COUNT(*) FILTER (WHERE status = 'verified'),
        COALESCE(SUM(react_loc), 0),
        COALESCE(SUM(vue_loc), 0),
        AVG(test_coverage) FILTER (WHERE test_coverage IS NOT NULL)
    FROM migration_status
    ON CONFLICT (date) DO UPDATE SET
        total_components = EXCLUDED.total_components,
        pending_components = EXCLUDED.pending_components,
        in_progress_components = EXCLUDED.in_progress_components,
        migrated_components = EXCLUDED.migrated_components,
        verified_components = EXCLUDED.verified_components,
        total_react_loc = EXCLUDED.total_react_loc,
        total_vue_loc = EXCLUDED.total_vue_loc,
        average_test_coverage = EXCLUDED.average_test_coverage,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;