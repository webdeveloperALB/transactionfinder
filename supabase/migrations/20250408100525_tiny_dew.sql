/*
  # Update temp_codes table and policies

  1. Changes
    - Safely add columns if they don't exist
    - Create indexes if they don't exist
    - Update policies for proper access control

  2. Security
    - Enable RLS if not already enabled
    - Ensure proper access control through policies
*/

-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'temp_codes' AND column_name = 'used_at'
    ) THEN
        ALTER TABLE temp_codes ADD COLUMN used_at timestamptz;
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_temp_codes_code') THEN
        CREATE INDEX idx_temp_codes_code ON temp_codes(code);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_temp_codes_used') THEN
        CREATE INDEX idx_temp_codes_used ON temp_codes(used);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE temp_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON temp_codes;
    DROP POLICY IF EXISTS "Enable insert access for service role" ON temp_codes;
    DROP POLICY IF EXISTS "Enable update access for service role" ON temp_codes;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for all users"
    ON temp_codes
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert access for all users"
    ON temp_codes
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
    ON temp_codes
    FOR UPDATE
    TO public
    USING (true);