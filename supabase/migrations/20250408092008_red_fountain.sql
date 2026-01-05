/*
  # Add System Settings Table

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `time_limits_enabled` (boolean)
      - `updated_at` (timestamp)
      - `updated_by` (text)

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_limits_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON system_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable update access for service role"
  ON system_settings
  FOR UPDATE
  TO service_role
  USING (true);

-- Insert default settings
INSERT INTO system_settings (time_limits_enabled, updated_by)
VALUES (true, 'system')
ON CONFLICT DO NOTHING;

-- Add new columns to search_results
ALTER TABLE search_results 
ADD COLUMN IF NOT EXISTS max_transactions integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS time_limit_enabled boolean DEFAULT true;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_search_results_time_limit ON search_results(time_limit_enabled);