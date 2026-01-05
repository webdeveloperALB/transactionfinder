/*
  # Fix Payment Completion Trigger

  1. Changes
    - Fix payment completion trigger to handle both CRM and user upgrades
    - Ensure search continues after payment completion
    - Add proper state management for search process
    - Fix transaction distribution logic

  2. Security
    - Maintain existing RLS policies
    - Ensure proper data handling
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
    search_duration interval;
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

        -- Set search duration based on tier
        search_duration := CASE
            WHEN NEW.tier = 'pro' THEN INTERVAL '72 hours'
            WHEN NEW.tier = 'enterprise' THEN INTERVAL '168 hours'
            ELSE INTERVAL '12 hours'
        END;

        -- Keep existing transactions for upgrades
        IF NEW.is_upgrade OR current_search.found_transactions IS NOT NULL THEN
            -- Keep existing transactions
            new_transactions := current_search.found_transactions;
        ELSE
            -- For new searches, calculate initial transaction
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
            status = 'searching',
            search_started_at = NOW(),
            search_completed_at = NOW() + search_duration,
            tier = NEW.tier,
            ai_assistance = CASE 
                WHEN NEW.tier IN ('pro', 'enterprise') THEN true 
                ELSE false 
            END,
            search_progress = 0,
            found_transactions = new_transactions,
            payment_required = false
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

-- Function to handle search updates
CREATE OR REPLACE FUNCTION handle_search_update()
RETURNS trigger AS $$
BEGIN
    -- Reset search progress when payment is completed
    IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
        NEW.search_progress := 0;
        NEW.status := 'searching';
    END IF;

    -- Validate search duration based on tier
    IF NEW.search_completed_at IS NOT NULL AND 
       NEW.search_started_at IS NOT NULL THEN
        DECLARE
            max_duration interval;
        BEGIN
            max_duration := CASE
                WHEN NEW.tier = 'free' THEN INTERVAL '12 hours'
                WHEN NEW.tier = 'pro' THEN INTERVAL '72 hours'
                WHEN NEW.tier = 'enterprise' THEN INTERVAL '168 hours'
                ELSE INTERVAL '12 hours'
            END;

            IF NEW.search_completed_at > NEW.search_started_at + max_duration THEN
                NEW.search_completed_at := NEW.search_started_at + max_duration;
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the search update trigger
DROP TRIGGER IF EXISTS search_update_trigger ON search_results;
CREATE TRIGGER search_update_trigger
    BEFORE INSERT OR UPDATE ON search_results
    FOR EACH ROW
    EXECUTE FUNCTION handle_search_update();