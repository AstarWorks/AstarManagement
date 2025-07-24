-- V011: Create RBAC (Role-Based Access Control) tables
-- Discord-style RBAC system with bitwise permission flags

-- Create roles table
CREATE TABLE roles (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(50)     NOT NULL UNIQUE,
    display_name            VARCHAR(100)    NOT NULL,
    permissions             BIGINT          NOT NULL DEFAULT 0,
    hierarchy_level         INTEGER         NOT NULL DEFAULT 0,
    color                   VARCHAR(7)      NOT NULL DEFAULT '#808080',
    description             VARCHAR(500),
    is_active               BOOLEAN         NOT NULL DEFAULT true,
    is_system_role          BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    updated_by              UUID,

    -- Constraints
    CONSTRAINT chk_role_name_format        CHECK (name ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT chk_display_name_length     CHECK (char_length(display_name) >= 2),
    CONSTRAINT chk_permissions_non_negative CHECK (permissions >= 0),
    CONSTRAINT chk_hierarchy_level_range   CHECK (hierarchy_level >= 0 AND hierarchy_level <= 1000),
    CONSTRAINT chk_color_hex_format        CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create user_roles join table for many-to-many relationship
CREATE TABLE user_roles (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL,
    role_id                 UUID            NOT NULL,
    is_active               BOOLEAN         NOT NULL DEFAULT true,
    granted_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by              UUID,
    expires_at              TIMESTAMPTZ,
    assignment_reason       VARCHAR(500),
    is_primary              BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    updated_by              UUID,

    -- Foreign key constraints
    CONSTRAINT fk_user_role_user           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role           FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_granted_by     FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,

    -- Unique constraint to prevent duplicate user-role assignments
    CONSTRAINT uk_user_role                UNIQUE (user_id, role_id),

    -- Business logic constraints
    CONSTRAINT chk_expires_at_future       CHECK (expires_at IS NULL OR expires_at > granted_at),
    CONSTRAINT chk_assignment_reason_length CHECK (assignment_reason IS NULL OR char_length(assignment_reason) >= 5)
);

-- Create indexes for performance
CREATE INDEX idx_role_name                  ON roles(name);
CREATE INDEX idx_role_hierarchy             ON roles(hierarchy_level);
CREATE INDEX idx_role_active                ON roles(is_active);
CREATE INDEX idx_role_system                ON roles(is_system_role);
CREATE INDEX idx_role_permissions           ON roles(permissions);

CREATE INDEX idx_user_role_user             ON user_roles(user_id);
CREATE INDEX idx_user_role_role             ON user_roles(role_id);
CREATE INDEX idx_user_role_active           ON user_roles(is_active);
CREATE INDEX idx_user_role_granted_at       ON user_roles(granted_at);
CREATE INDEX idx_user_role_expires_at       ON user_roles(expires_at);
CREATE INDEX idx_user_role_primary          ON user_roles(is_primary);
CREATE INDEX idx_user_role_granted_by       ON user_roles(granted_by);

-- Composite indexes for common query patterns
CREATE INDEX idx_user_role_user_active      ON user_roles(user_id, is_active);
CREATE INDEX idx_user_role_role_active      ON user_roles(role_id, is_active);
CREATE INDEX idx_user_role_active_expiry    ON user_roles(is_active, expires_at);

-- Insert default system roles
INSERT INTO roles (id, name, display_name, permissions, hierarchy_level, color, description, is_system_role) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'CLIENT', 
    'Client', 
    38,  -- MATTER_READ(2) + DOCUMENT_READ(64) + COMM_READ(32768) = 2 + 64 + 32768 = 32834 - Recalculating: MATTER_READ(1<<1=2) + DOCUMENT_READ(1<<6=64) + COMM_READ(1<<15=32768) = 32834
    10, 
    '#6B7280', 
    'External client with read-only access to their matters',
    true
),
(
    'c0000000-0000-0000-0000-000000000002',
    'CLERK', 
    'Clerk', 
    2031614,  -- MATTER_CREATE(1) + MATTER_READ(2) + MATTER_UPDATE(4) + DOCUMENT_CREATE(32) + DOCUMENT_READ(64) + DOCUMENT_UPDATE(128) + CLIENT_CREATE(1024) + CLIENT_READ(2048) + CLIENT_UPDATE(4096) + COMM_CREATE(16384) + COMM_READ(32768) + COMM_UPDATE(65536) + EXPENSE_CREATE(262144) + EXPENSE_READ(524288) + EXPENSE_UPDATE(1048576)
    50, 
    '#3B82F6', 
    'Internal staff with CRUD access but no deletion rights',
    true
),
(
    'c0000000-0000-0000-0000-000000000003',
    'LAWYER', 
    'Lawyer', 
    268435455,  -- All permissions (2^28 - 1 = 268435455)
    100, 
    '#10B981', 
    'Legal professional with full system access',
    true
);

-- Update existing users to have role assignments based on their current UserRole enum
-- This assumes users table has a 'role' column with enum values: LAWYER, CLERK, CLIENT

-- Assign CLIENT role to users with CLIENT enum value
INSERT INTO user_roles (user_id, role_id, granted_at, is_primary, assignment_reason)
SELECT 
    u.id,
    'c0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    true,
    'Migration from UserRole enum'
FROM users u 
WHERE u.role = 'CLIENT';

-- Assign CLERK role to users with CLERK enum value  
INSERT INTO user_roles (user_id, role_id, granted_at, is_primary, assignment_reason)
SELECT 
    u.id,
    'c0000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP,
    true,
    'Migration from UserRole enum'
FROM users u 
WHERE u.role = 'CLERK';

-- Assign LAWYER role to users with LAWYER enum value
INSERT INTO user_roles (user_id, role_id, granted_at, is_primary, assignment_reason)
SELECT 
    u.id,
    'c0000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP,
    true,
    'Migration from UserRole enum'
FROM users u 
WHERE u.role = 'LAWYER';

-- Add comments for documentation
COMMENT ON TABLE roles IS 'Role definitions with Discord-style bitwise permission flags';
COMMENT ON COLUMN roles.permissions IS 'Bitwise permission flags (64-bit integer supporting up to 64 permissions)';
COMMENT ON COLUMN roles.hierarchy_level IS 'Numeric hierarchy level for role precedence (higher = more authority)';
COMMENT ON COLUMN roles.color IS 'Hex color code for UI display (#RRGGBB format)';
COMMENT ON COLUMN roles.is_system_role IS 'Whether this role is system-defined and cannot be deleted';

COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles with audit metadata';
COMMENT ON COLUMN user_roles.expires_at IS 'Optional expiration timestamp for temporary role assignments';
COMMENT ON COLUMN user_roles.granted_by IS 'User ID who granted this role assignment';
COMMENT ON COLUMN user_roles.is_primary IS 'Whether this is the primary role for the user';
COMMENT ON COLUMN user_roles.assignment_reason IS 'Reason or justification for this role assignment';

-- Create function to automatically deactivate expired role assignments
CREATE OR REPLACE FUNCTION deactivate_expired_user_roles()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE user_roles 
    SET 
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        expires_at IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP
        AND is_active = true;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the cleanup if any rows were affected
    IF affected_rows > 0 THEN
        INSERT INTO audit_logs (event_type, resource_type, resource_id, details, created_at)
        VALUES (
            'ROLE_EXPIRY_CLEANUP',
            'USER_ROLE',
            NULL,
            FORMAT('Automatically deactivated %s expired role assignments', affected_rows),
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate permission values
CREATE OR REPLACE FUNCTION validate_permission_value(permission_value BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check that permission value is non-negative and within valid range
    -- Maximum valid value is 2^28 - 1 (268435455) for 28 defined permissions
    RETURN permission_value >= 0 AND permission_value <= 268435455;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to validate permission values on roles table
CREATE OR REPLACE FUNCTION check_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_permission_value(NEW.permissions) THEN
        RAISE EXCEPTION 'Invalid permission value: %. Must be between 0 and 268435455.', NEW.permissions;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_role_permissions
    BEFORE INSERT OR UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION check_role_permissions();

-- Create trigger to ensure only one primary role per user
CREATE OR REPLACE FUNCTION ensure_single_primary_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a role as primary, deactivate other primary roles for the same user
    IF NEW.is_primary = true THEN
        UPDATE user_roles 
        SET 
            is_primary = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE 
            user_id = NEW.user_id 
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
            AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_primary_role
    BEFORE INSERT OR UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_role();

-- Create view for easier querying of user effective permissions
CREATE VIEW user_effective_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    BIT_OR(r.permissions) as effective_permissions,
    MAX(r.hierarchy_level) as highest_hierarchy_level,
    COUNT(ur.id) as role_count,
    ARRAY_AGG(r.name ORDER BY r.hierarchy_level DESC) as role_names,
    ARRAY_AGG(r.display_name ORDER BY r.hierarchy_level DESC) as role_display_names
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id 
    AND ur.is_active = true 
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
GROUP BY u.id, u.email, u.first_name, u.last_name;

COMMENT ON VIEW user_effective_permissions IS 'Materialized view showing each users effective permissions and roles';

-- Grant appropriate permissions (adjust based on your application user)
-- GRANT SELECT ON roles TO application_user;
-- GRANT SELECT, INSERT, UPDATE ON user_roles TO application_user;
-- GRANT SELECT ON user_effective_permissions TO application_user;