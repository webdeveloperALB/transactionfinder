/*
  # Add Search Progress Tracking

  1. Changes
    - Add search_progress column to search_results
    - Add AI insights tracking
    - Update payment completion trigger

  2. Security
    - Maintain existing RLS policies
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
BEGIN
  -- If payment status changes to finished or confirmed
  IF NEW.status IN ('finished', 'confirmed') AND OLD.status != NEW.status THEN
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
      ai_insights = '[]'::jsonb,
      -- Keep existing found transactions
      found_transactions = COALESCE(
        (SELECT found_transactions FROM search_results 
         WHERE user_id = NEW.user_id 
         ORDER BY created_at DESC 
         LIMIT 1),
        '[]'::jsonb
      )
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