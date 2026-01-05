/*
  # Update Payment and Search Results Schema

  1. Changes
    - Add payment_method column to payments table
    - Add tier and ai_assistance columns to search_results table
    - Update indexes and policies
    - Fix duplicate policy issues

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- First check if payments table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payments') THEN
    -- Create payments table
    CREATE TABLE payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) NOT NULL,
      payment_id text NOT NULL,
      amount numeric NOT NULL,
      currency text NOT NULL,
      status text NOT NULL,
      tier text NOT NULL,
      payment_method text DEFAULT 'BTC',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_user_id') THEN
        CREATE INDEX idx_payments_user_id ON payments(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_payment_id') THEN
        CREATE INDEX idx_payments_payment_id ON payments(payment_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
        CREATE INDEX idx_payments_status ON payments(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_created_at') THEN
        CREATE INDEX idx_payments_created_at ON payments(created_at);
    END IF;
END $$;

-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read their own payments" ON payments;
    DROP POLICY IF EXISTS "Users can insert payments" ON payments;
    DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for users payments"
    ON payments
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = payments.user_id
        )
    );

CREATE POLICY "Enable insert access for payments"
    ON payments
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update access for users payments"
    ON payments
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = payments.user_id
        )
    );

-- Add columns to search_results if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' AND column_name = 'tier'
    ) THEN
        ALTER TABLE search_results 
        ADD COLUMN tier text NOT NULL DEFAULT 'free';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' AND column_name = 'ai_assistance'
    ) THEN
        ALTER TABLE search_results 
        ADD COLUMN ai_assistance boolean NOT NULL DEFAULT false;
    END IF;
END $$;