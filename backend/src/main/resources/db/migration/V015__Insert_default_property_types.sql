-- V015__Insert_default_property_types.sql
-- ========================================
-- Insert default property types for the flexible table system
-- Uses ON CONFLICT DO NOTHING for idempotency (safe to run multiple times)
-- ========================================

-- Insert default property types
-- Each type includes validation schema, default config, and UI metadata
INSERT INTO property_type_catalog (
    id, 
    category, 
    validation_schema, 
    default_config, 
    ui_component, 
    icon, 
    description, 
    is_active, 
    is_custom,
    created_at
) VALUES 
    -- Basic Types
    ('text', 'basic', 
     '{"maxLength": 500, "minLength": 0, "nullable": true}'::jsonb, 
     '{"placeholder": "Enter text", "trim": true}'::jsonb,
     'TextInput', 'type', 
     'Single line text input', 
     true, false, CURRENT_TIMESTAMP),
    
    ('long_text', 'basic',
     '{"maxLength": 5000, "minLength": 0, "nullable": true}'::jsonb,
     '{"rows": 5, "placeholder": "Enter text", "trim": true}'::jsonb,
     'TextArea', 'align-left', 
     'Multi-line text input', 
     true, false, CURRENT_TIMESTAMP),
    
    ('number', 'basic',
     '{"min": null, "max": null, "precision": 2, "nullable": true}'::jsonb,
     '{"step": 1, "placeholder": "0"}'::jsonb,
     'NumberInput', 'hash', 
     'Numeric value input', 
     true, false, CURRENT_TIMESTAMP),
    
    ('checkbox', 'basic',
     '{"nullable": false}'::jsonb,
     '{"default": false}'::jsonb,
     'Checkbox', 'check-square', 
     'Boolean checkbox', 
     true, false, CURRENT_TIMESTAMP),
    
    ('date', 'basic',
     '{"format": "YYYY-MM-DD", "nullable": true}'::jsonb,
     '{"placeholder": "Select date", "format": "YYYY-MM-DD"}'::jsonb,
     'DatePicker', 'calendar', 
     'Date picker', 
     true, false, CURRENT_TIMESTAMP),
    
    ('select', 'basic',
     '{"options": [], "nullable": true}'::jsonb,
     '{"multiple": false, "placeholder": "Select an option", "searchable": true}'::jsonb,
     'Select', 'list', 
     'Single selection from options', 
     true, false, CURRENT_TIMESTAMP),
    
    ('multi_select', 'basic',
     '{"options": [], "maxItems": null, "nullable": true}'::jsonb,
     '{"multiple": true, "placeholder": "Select options", "searchable": true}'::jsonb,
     'MultiSelect', 'list', 
     'Multiple selection from options', 
     true, false, CURRENT_TIMESTAMP),
    
    -- Relation Types
    ('user', 'relation',
     '{"nullable": true, "allowMultiple": false}'::jsonb,
     '{"placeholder": "Select user", "searchable": true}'::jsonb,
     'UserSelect', 'user', 
     'User selector', 
     true, false, CURRENT_TIMESTAMP),
    
    -- Advanced Types
    ('email', 'advanced',
     '{"pattern": "^[\\w.-]+@[\\w.-]+\\.\\w+$", "nullable": true}'::jsonb,
     '{"placeholder": "email@example.com", "trim": true, "lowercase": true}'::jsonb,
     'EmailInput', 'mail', 
     'Email address input', 
     true, false, CURRENT_TIMESTAMP),
    
    ('phone', 'advanced',
     '{"pattern": "^[+\\d\\s()-]+$", "nullable": true}'::jsonb,
     '{"placeholder": "+1 (555) 123-4567", "trim": true}'::jsonb,
     'PhoneInput', 'phone', 
     'Phone number input', 
     true, false, CURRENT_TIMESTAMP),
    
    ('url', 'advanced',
     '{"pattern": "^https?://.+", "nullable": true}'::jsonb,
     '{"placeholder": "https://example.com", "trim": true}'::jsonb,
     'UrlInput', 'link', 
     'URL input', 
     true, false, CURRENT_TIMESTAMP),
    
    ('file', 'advanced',
     '{"maxSize": 10485760, "allowedTypes": [], "nullable": true}'::jsonb,
     '{"multiple": false, "maxFiles": 1}'::jsonb,
     'FileUpload', 'file', 
     'File upload', 
     true, false, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Log the result
DO $$
DECLARE
    inserted_count INTEGER;
BEGIN
    -- Count how many types were inserted
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    IF inserted_count > 0 THEN
        RAISE NOTICE 'Inserted % new property type(s)', inserted_count;
    ELSE
        RAISE NOTICE 'All property types already exist (no changes made)';
    END IF;
END $$;

-- Verify the insertion
DO $$
DECLARE
    total_count INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM property_type_catalog;
    SELECT COUNT(*) INTO active_count FROM property_type_catalog WHERE is_active = true;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Property Type Catalog Status:';
    RAISE NOTICE 'Total types: %', total_count;
    RAISE NOTICE 'Active types: %', active_count;
    RAISE NOTICE '========================================';
END $$;