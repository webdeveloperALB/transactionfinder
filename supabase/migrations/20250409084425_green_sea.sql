/*
  # Add Upgrade Flag to Payments

  1. Changes
    - Add is_upgrade column to payments table
    - Update payment completion trigger to handle upgrades
    - Add index for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add is_upgrade column to payments table
ALTER TABLE payments
ADD COLUMN is_upgrade boolean DEFAULT false;

-- Create index for is_upgrade column
CREATE INDEX idx_payments_is_upgrade ON payments(is_upgrade);

-- Update the payment completion trigger function
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
        IF NEW.is_upgrade THEN
            -- For upgrades, keep all existing transactions
            new_transactions := existing_transactions;
        ELSE
            -- For new searches, start with first transaction
            new_transactions := '[]'::jsonb;
            IF jsonb_array_length(existing_transactions) > 0 THEN
                new_transactions := jsonb_build_array(existing_transactions->0);
            END IF;
        END IF;

        -- Add additional transactions for paid tiers if not an upgrade
        -- or if upgrading from free tier
        IF NOT NEW.is_upgrade OR (NEW.is_upgrade AND jsonb_array_length(existing_transactions) <= 1) THEN
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
        END IF;

        -- Update related search_results
        UPDATE search_results
        SET 
            payment_status = 'completed',
            payment_completed_at = NOW(),
            status = 'searching',
            search_started_at = NOW(),
            search_completed_at = 
                CASE 
                    WHEN NEW.tier = 'free' THEN NOW() + INTERVAL '12 hours'
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