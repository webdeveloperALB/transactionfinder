/*
  # Payment System Setup

  1. New Tables
    - `payments` table for storing payment information
    - Add tier and AI assistance columns to search_results

  2. Security
    - Enable RLS on payments table
    - Add appropriate policies for payment management
*/

-- Create payments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payments') THEN
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Create policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for users payments" ON payments;
    DROP POLICY IF EXISTS "Enable insert access for payments" ON payments;
    DROP POLICY IF EXISTS "Enable update access for users payments" ON payments;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

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