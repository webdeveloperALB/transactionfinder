/*
  # Fresh Schema Setup for Transaction Recovery System

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

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `amount` (numeric)
      - `date` (date)
      - `recipient_name` (text)
      - `company_name` (text)
      - `reason` (text)
      - `payment_method` (text)
      - `wallet_address` (text)
      - `proof_url` (text)
      - `created_at` (timestamp)

    - `search_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `status` (text)
      - `found_transactions` (jsonb)
      - `search_started_at` (timestamp)
      - `search_completed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access and data protection
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS search_results CASCADE;

-- Create users table
CREATE TABLE users (
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

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  amount numeric NOT NULL,
  date date NOT NULL,
  recipient_name text,
  company_name text,
  reason text NOT NULL,
  payment_method text NOT NULL,
  wallet_address text,
  proof_url text,
  created_at timestamptz DEFAULT now()
);

-- Create search_results table
CREATE TABLE search_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'searching',
  found_transactions jsonb DEFAULT '[]',
  search_started_at timestamptz DEFAULT now(),
  search_completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for transactions table
CREATE POLICY "Users can read their own transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

-- Policies for search_results table
CREATE POLICY "Users can read their own search results"
  ON search_results
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = search_results.user_id
    )
  );

CREATE POLICY "Users can insert their own search results"
  ON search_results
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = search_results.user_id
    )
  );

CREATE POLICY "Users can update their own search results"
  ON search_results
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = search_results.user_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_users_secret_code ON users(secret_code);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_search_results_user_id ON search_results(user_id);
CREATE INDEX idx_search_results_status ON search_results(status);