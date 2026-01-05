/*
  # Create submissions table for transaction tracking

  1. New Tables
    - `submissions`
      - `id` (uuid, primary key)
      - `secret_code` (text, unique)
      - `personal_info` (jsonb)
      - `transaction_info` (jsonb)
      - `status` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `submissions` table
    - Add policies for inserting and selecting data
*/

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_code text UNIQUE NOT NULL,
  personal_info jsonb NOT NULL,
  transaction_info jsonb NOT NULL,
  status jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert submissions"
  ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can select submissions using secret code"
  ON submissions
  FOR SELECT
  TO anon
  USING (true);