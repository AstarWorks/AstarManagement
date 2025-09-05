-- Test database initialization script
-- Creates app_user with BYPASSRLS for test environment

-- Create app_user role with BYPASSRLS privilege (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
END
$$;

-- Ensure app_user has BYPASSRLS privilege (for fast general tests)
ALTER ROLE app_user BYPASSRLS;

-- Grant necessary permissions to app_user
GRANT CONNECT ON DATABASE astarmanagement_test TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO app_user;

-- Create rls_test_user role WITHOUT BYPASSRLS (for RLS testing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rls_test_user') THEN
        CREATE ROLE rls_test_user;
    END IF;
END
$$;

-- Ensure rls_test_user does NOT have BYPASSRLS privilege
ALTER ROLE rls_test_user NOBYPASSRLS;

-- Grant necessary permissions to rls_test_user
GRANT CONNECT ON DATABASE astarmanagement_test TO rls_test_user;
GRANT USAGE ON SCHEMA public TO rls_test_user;
GRANT CREATE ON SCHEMA public TO rls_test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rls_test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rls_test_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rls_test_user;

-- Set default privileges for future objects for rls_test_user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO rls_test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO rls_test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO rls_test_user;

-- Ensure the database is ready for connections
SELECT 'TestContainer initialized with app_user' AS status;