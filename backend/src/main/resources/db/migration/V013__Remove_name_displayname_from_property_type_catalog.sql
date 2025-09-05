-- Remove name and display_name columns from property_type_catalog table
-- Add is_custom column to track tenant-specific custom types

-- Drop existing columns
ALTER TABLE property_type_catalog
    DROP COLUMN IF EXISTS name,
    DROP COLUMN IF EXISTS display_name;

-- Add is_custom column
ALTER TABLE property_type_catalog
    ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to mark them as built-in (not custom)
UPDATE property_type_catalog SET is_custom = false WHERE is_custom IS NULL;

-- Add index for custom types filtering
CREATE INDEX IF NOT EXISTS idx_property_type_catalog_is_custom
    ON property_type_catalog(is_custom);

-- Add index for category and active status
CREATE INDEX IF NOT EXISTS idx_property_type_catalog_category_active
    ON property_type_catalog(category, is_active);

-- Add comment to table
COMMENT ON TABLE property_type_catalog IS 'Catalog of available property types for flexible tables';
COMMENT ON COLUMN property_type_catalog.id IS 'Unique identifier for the property type (e.g., text, number, select)';
COMMENT ON COLUMN property_type_catalog.category IS 'Category of the property type (basic, advanced, relation, system)';
COMMENT ON COLUMN property_type_catalog.is_custom IS 'Whether this is a custom type created by a tenant';
COMMENT ON COLUMN property_type_catalog.is_active IS 'Whether this property type is currently active and available for use';