-- Simple test to verify PGobject JSONB conversion works
INSERT INTO records (id, table_id, data, position, created_at, updated_at, version)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'b47ac10b-58cc-4372-a567-0e02b2c3d480', 
    '{"test": "value", "number": 42}'::jsonb,
    65536.0,
    now(),
    now(),
    0
);

SELECT * FROM records WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';