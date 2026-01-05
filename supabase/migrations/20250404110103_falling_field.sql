/*
  # Add AI assistance column to search_results table

  1. Changes
    - Add `ai_assistance` column to `search_results` table
      - Type: boolean
      - Default: false
      - Not nullable
    - Add `tier` column to `search_results` table
      - Type: text
      - Default: 'free'
      - Not nullable

  2. Notes
    - Both columns are required for the tier-based search functionality
    - Default values ensure backward compatibility
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'search_results' AND column_name = 'ai_assistance'
  ) THEN
    ALTER TABLE search_results 
    ADD COLUMN ai_assistance boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'search_results' AND column_name = 'tier'
  ) THEN
    ALTER TABLE search_results 
    ADD COLUMN tier text NOT NULL DEFAULT 'free';
  END IF;
END $$;