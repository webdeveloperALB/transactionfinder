/*
  # Update Payment Completion Trigger

  1. Changes
    - Only start new search for initial payments
    - Preserve search state for upgrades
    - Keep existing transactions for upgrades
    - Update tier and duration without resetting search

  2. Security
    - Maintain existing RLS policies
*/

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
    current_search record;
BEGIN
    -- If payment status changes to finished or confirmed
    IF NEW.status IN ('finished', 'confirmed') AND OLD.status != NEW.status THEN
        -- Get current search state
        SELECT * INTO current_search
        FROM search_results
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Get the total transaction amount
        SELECT amount INTO total_amount
        FROM transactions
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Handle transactions based on payment type
        IF NEW.is_upgrade THEN
            -- For upgrades, keep existing transactions and search state
            new_transactions := current_search.found_transactions;
            
            -- Update search results for upgrade
            UPDATE search_results
            SET 
                payment_status = 'completed',
                payment_completed_at = NOW(),
                tier = NEW.tier,
                ai_assistance = CASE 
                    WHEN NEW.tier IN ('pro', 'enterprise') THEN true 
                    ELSE false 
                END,
                -- Only update end time if search is still in progress
                search_completed_at = CASE 
                    WHEN status = 'searching' THEN
                        CASE 
                            WHEN NEW.tier = 'pro' THEN NOW() + INTERVAL '72 hours'
                            WHEN NEW.tier = 'enterprise' THEN NOW() + INTERVAL '168 hours'
                            ELSE NOW() + INTERVAL '12 hours'
                        END
                    ELSE search_completed_at
                END
            WHERE id = current_search.id;
        ELSE
            -- For new payments, start fresh search
            -- Initialize with existing transactions if any
            new_transactions := '[]'::jsonb;
            IF current_search.found_transactions IS NOT NULL AND 
               jsonb_array_length(current_search.found_transactions) > 0 THEN
                new_transactions := jsonb_build_array(current_search.found_transactions->0);
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

            -- Update search results for new payment
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
            WHERE id = current_search.id;
        END IF;
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