/*
  # Add Indexes for Payment Processing

  1. Changes
    - Add indexes to optimize payment-related queries
    - Add indexes for search results queries
    - Add timeout settings for long-running queries

  2. Security
    - Maintain existing RLS policies
*/

-- Add indexes for payment processing
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Add indexes for search results
CREATE INDEX IF NOT EXISTS idx_search_results_user_id_created_at ON search_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_results_payment_status ON search_results(payment_status);

-- Set statement timeout for payment-related operations
ALTER ROLE authenticated SET statement_timeout = '30s';
ALTER ROLE anon SET statement_timeout = '30s';

-- Add function to handle payment timeouts
CREATE OR REPLACE FUNCTION handle_payment_timeout()
RETURNS trigger AS $$
BEGIN
  -- Set a shorter timeout for payment operations
  SET LOCAL statement_timeout = '10s';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payments table
DROP TRIGGER IF EXISTS payment_timeout_trigger ON payments;
CREATE TRIGGER payment_timeout_trigger
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH STATEMENT
    EXECUTE FUNCTION handle_payment_timeout();

-- Create trigger for search_results table
DROP TRIGGER IF EXISTS search_results_timeout_trigger ON search_results;
CREATE TRIGGER search_results_timeout_trigger
    BEFORE UPDATE ON search_results
    FOR EACH STATEMENT
    EXECUTE FUNCTION handle_payment_timeout();