-- Add new columns to search_results
ALTER TABLE search_results 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_completed_at timestamptz;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_search_results_payment_status ON search_results(payment_status);
CREATE INDEX IF NOT EXISTS idx_search_results_payment_required ON search_results(payment_required);

-- Update existing search results to set payment_required = false
UPDATE search_results 
SET payment_required = false 
WHERE payment_required IS NULL;

-- Function to handle payment completion
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
      ai_assistance = true,
      found_transactions = '[]'::jsonb
    WHERE 
      user_id = NEW.user_id 
      AND payment_required = true
      AND payment_status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS payment_completion_trigger ON payments;
CREATE TRIGGER payment_completion_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_completion();