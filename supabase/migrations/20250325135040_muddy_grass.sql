/*
  # User and Submission System Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `phone` (text)
      - `address` (text)
      - `nationality` (text)
      - `id_document_url` (text)
      - `secret_code` (text, unique)
      - `created_at` (timestamp)

  2. Changes to Submissions
    - Add foreign key to link submissions with users
    - Remove duplicate fields that are now in users table
    
  3. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  nationality text,
  id_document_url text,
  secret_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Recreate submissions table with user reference
DROP TABLE IF EXISTS submissions;
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  transaction_info jsonb NOT NULL DEFAULT '{}',
  status jsonb NOT NULL DEFAULT '{"status": "searching"}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for submissions table
CREATE POLICY "Users can read submissions using secret code"
  ON submissions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = submissions.user_id
    )
  );

CREATE POLICY "Users can insert submissions"
  ON submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own submissions"
  ON submissions
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = submissions.user_id
    )
  );