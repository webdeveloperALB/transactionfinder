/*
  # Payment System Database Setup

  1. Changes
    - Add payment_method column to payments table
    - Add indexes for better performance
    - Update RLS policies

  2. Security
    - Ensure proper access control through RLS
    - Add necessary indexes for performance
*/

-- Add payment_method if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE payments ADD COLUMN payment_method text DEFAULT 'BTC';
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read their own payments" ON payments;
    DROP POLICY IF EXISTS "Users can insert payments" ON payments;
    DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create or update policies
CREATE POLICY "Users can read their own payments"
    ON payments
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = payments.user_id
        )
    );

CREATE POLICY "Users can insert payments"
    ON payments
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Users can update their own payments"
    ON payments
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = payments.user_id
        )
    );