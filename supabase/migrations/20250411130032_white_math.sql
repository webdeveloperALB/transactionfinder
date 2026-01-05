/*
  # Fix Search Duration Update

  1. Changes
    - Add function to update search duration with proper validation
    - Add trigger to handle search updates
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper validation of duration limits
*/

-- Function to update search duration
CREATE OR REPLACE FUNCTION update_search_duration(
  search_id uuid,
  new_end_time timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  search_record record;
  max_duration interval;
BEGIN
  -- Get current search record
  SELECT * INTO search_record
  FROM search_results
  WHERE id = search_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Determine maximum duration based on tier
  max_duration := CASE
    WHEN search_record.tier = 'free' THEN INTERVAL '12 hours'
    WHEN search_record.tier = 'pro' THEN INTERVAL '72 hours'
    WHEN search_record.tier = 'enterprise' THEN INTERVAL '168 hours'
    ELSE INTERVAL '12 hours'
  END;

  -- Validate new end time
  IF new_end_time > search_record.search_started_at + max_duration THEN
    RETURN false;
  END IF;

  -- Update search completion time
  UPDATE search_results
  SET search_completed_at = new_end_time
  WHERE id = search_id;

  RETURN true;
END;
$$;

-- Function to handle search updates
CREATE OR REPLACE FUNCTION handle_search_update()
RETURNS trigger AS $$
BEGIN
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

-- Create trigger for search updates
DROP TRIGGER IF EXISTS search_update_trigger ON search_results;
CREATE TRIGGER search_update_trigger
  BEFORE INSERT OR UPDATE ON search_results
  FOR EACH ROW
  EXECUTE FUNCTION handle_search_update();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_results_tier ON search_results(tier);
CREATE INDEX IF NOT EXISTS idx_search_results_dates ON search_results(search_started_at, search_completed_at);