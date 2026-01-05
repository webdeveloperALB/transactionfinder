/*
  # Add temporary codes table for unassigned secret codes

  1. New Tables
    - `temp_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `used` (boolean)
      - `created_at` (timestamp)
      - `used_at` (timestamp)

  2. Security
    - Enable RLS on temp_codes table
    - Add policies for managing temporary codes
*/

CREATE TABLE temp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Enable RLS
ALTER TABLE temp_codes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_temp_codes_code ON temp_codes(code);
CREATE INDEX idx_temp_codes_used ON temp_codes(used);

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON temp_codes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for service role"
  ON temp_codes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Enable update access for service role"
  ON temp_codes
  FOR UPDATE
  TO service_role
  USING (true);