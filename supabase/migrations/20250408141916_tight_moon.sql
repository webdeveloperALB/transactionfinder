/*
  # Update Payment Completion Trigger

  1. Changes
    - Modify payment completion trigger to preserve existing transactions
    - Add proper handling for tier upgrades
    - Update search results when payment is completed

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data handling
*/

-- Add new columns to search_results if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' AND column_name = 'search_progress'
    ) THEN
        ALTER TABLE search_results 
        ADD COLUMN search_progress integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_results' AND column_name = 'ai_insights'
    ) THEN
        ALTER TABLE search_results 
        ADD COLUMN ai_insights jsonb DEFAULT '[]';
    END IF;
END $$;

-- Create or replace the payment completion trigger function
CREATE OR REPLACE FUNCTION handle_payment_completion()
RETURNS TRIGGER AS $$
DECLARE
    existing_transactions jsonb;
    total_amount numeric;
    new_transactions jsonb;
    portions numeric[] := ARRAY[0.25, 0.35, 0.40];
    btc_price numeric := 53000;
    i integer;
BEGIN
    -- If payment status changes to finished or confirmed
    IF NEW.status IN ('finished', 'confirmed') AND OLD.status != NEW.status THEN
        -- Get the total transaction amount
        SELECT amount INTO total_amount
        FROM transactions
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Get existing transactions
        SELECT found_transactions INTO existing_transactions
        FROM search_results
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Initialize new transactions array
        new_transactions := '[]'::jsonb;

        -- Keep existing transaction if any
        IF jsonb_array_length(existing_transactions) > 0 THEN
            new_transactions := jsonb_build_array(existing_transactions->0);
        END IF;

        -- Add additional transactions for paid tiers
        FOR i IN 2..3 LOOP
            new_transactions := new_transactions || jsonb_build_array(jsonb_build_object(
                'amount', ROUND((total_amount * portions[i])::numeric, 2),
                'bitcoinAmount', ROUND((total_amount * portions[i] / btc_price)::numeric, 8),
                'transactionId', '1NZqD6HTewgKjPmxnvJ8b2Sy6sHBpQ4X',
                'bankEmail', 'support@digitalchainbank.com',
                'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                'walletAddress', '1NZqD6HTewgKjPmxnvJ8b2Sy6sHBpQ4X'
            ));
        END LOOP;

        -- Update related search_results
        UPDATE search_results
        SET 
            payment_status = 'completed',
            payment_completed_at = NOW(),
            status = 'searching',
            search_started_at = NOW(),
            search_completed_at = 
                CASE 
                    WHEN NEW.tier = 'pro' THEN NOW() + INTERVAL '72 hours'
                    WHEN NEW.tier = 'enterprise' THEN NOW() + INTERVAL '168 hours'
                    ELSE NOW() + INTERVAL '12 hours'
                END,
            tier = NEW.tier,
            ai_assistance = CASE 
                WHEN NEW.tier IN ('pro', 'enterprise') THEN true 
                ELSE false 
            END,
            search_progress = 0,
            found_transactions = new_transactions
        WHERE 
            user_id = NEW.user_id 
            AND id = (
                SELECT id FROM search_results 
                WHERE user_id = NEW.user_id 
                ORDER BY created_at DESC 
                LIMIT 1
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS payment_completion_trigger ON payments;
CREATE TRIGGER payment_completion_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_completion();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_results_progress ON search_results(search_progress);
CREATE INDEX IF NOT EXISTS idx_search_results_ai_insights ON search_results USING gin(ai_insights);