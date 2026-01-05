/*
  # Add Transaction Completion Check

  1. Changes
    - Add function to check and complete missing transactions
    - Add trigger to ensure transactions are complete
    - Fix wallet address generation

  2. Security
    - Maintain existing RLS policies
    - Ensure proper error handling
*/

-- Function to check and complete transactions
CREATE OR REPLACE FUNCTION complete_missing_transactions(search_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    current_search record;
    total_amount numeric;
    remaining_amount numeric;
    btc_price numeric := 53000;
    new_transactions jsonb;
    first_transaction jsonb;
    wallet_address text;
BEGIN
    -- Get current search state
    SELECT * INTO current_search
    FROM search_results
    WHERE id = search_id;

    -- Get total transaction amount
    SELECT amount INTO total_amount
    FROM transactions
    WHERE user_id = current_search.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Check number of transactions
    IF current_search.found_transactions IS NULL OR 
       jsonb_array_length(current_search.found_transactions) = 0 THEN
        -- No transactions exist, create initial transaction
        -- Random percentage between 0.02% and 0.05%
        DECLARE
            initial_percentage numeric := (random() * (0.0005 - 0.0002) + 0.0002);
            initial_amount numeric := ROUND((total_amount * initial_percentage)::numeric, 2);
        BEGIN
            -- Enforce min/max limits
            IF initial_amount < 200 THEN
                initial_amount := 200;
            ELSIF initial_amount > 1000 THEN
                initial_amount := 1000;
            END IF;

            -- Get wallet address
            wallet_address := get_blockchair_address(
                floor((initial_amount / btc_price) * 100000000)
            );

            new_transactions := jsonb_build_array(jsonb_build_object(
                'amount', initial_amount,
                'bitcoinAmount', ROUND((initial_amount / btc_price)::numeric, 8),
                'transactionId', wallet_address,
                'bankEmail', 'support@digitalchainbank.com',
                'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                'walletAddress', wallet_address
            ));
        END;
    ELSIF jsonb_array_length(current_search.found_transactions) = 1 AND 
          current_search.tier IN ('pro', 'enterprise') THEN
        -- Keep first transaction and add two more
        first_transaction := current_search.found_transactions->0;
        remaining_amount := total_amount - (first_transaction->>'amount')::numeric;

        -- Get wallet addresses
        wallet_address := get_blockchair_address(
            floor((remaining_amount * 0.45 / btc_price) * 100000000)
        );

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
    ELSIF jsonb_array_length(current_search.found_transactions) = 2 AND 
          current_search.tier IN ('pro', 'enterprise') THEN
        -- Keep first two transactions and add third
        first_transaction := current_search.found_transactions->0;
        remaining_amount := total_amount - (first_transaction->>'amount')::numeric -
                          (current_search.found_transactions->1->>'amount')::numeric;

        -- Get wallet address
        wallet_address := get_blockchair_address(
            floor((remaining_amount / btc_price) * 100000000)
        );

        new_transactions := jsonb_build_array(
            current_search.found_transactions->0,
            current_search.found_transactions->1,
            jsonb_build_object(
                'amount', ROUND(remaining_amount::numeric, 2),
                'bitcoinAmount', ROUND((remaining_amount / btc_price)::numeric, 8),
                'transactionId', wallet_address,
                'bankEmail', 'support@digitalchainbank.com',
                'bankAddress', 'Avenida Balboa, Edificio 121, Bella Vista',
                'walletAddress', wallet_address
            )
        );
    ELSE
        -- Keep existing transactions
        new_transactions := current_search.found_transactions;
    END IF;

    -- Update search results with new transactions
    IF new_transactions IS NOT NULL THEN
        UPDATE search_results
        SET found_transactions = new_transactions
        WHERE id = search_id;
    END IF;
END;
$$;

-- Create a trigger to check for missing transactions
CREATE OR REPLACE FUNCTION check_transactions_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check and complete transactions after any update
    IF NEW.tier IN ('pro', 'enterprise') AND 
       (NEW.found_transactions IS NULL OR 
        jsonb_array_length(NEW.found_transactions) < 3) THEN
        PERFORM complete_missing_transactions(NEW.id);
    ELSIF NEW.tier = 'free' AND 
          (NEW.found_transactions IS NULL OR 
           jsonb_array_length(NEW.found_transactions) = 0) THEN
        PERFORM complete_missing_transactions(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_transactions_trigger ON search_results;

-- Create the trigger
CREATE TRIGGER check_transactions_trigger
    AFTER UPDATE ON search_results
    FOR EACH ROW
    EXECUTE FUNCTION check_transactions_trigger();