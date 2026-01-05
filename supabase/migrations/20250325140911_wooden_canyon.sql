/*
  # Fix Transaction Table Policies

  1. Changes
    - Drop existing transaction policies
    - Create new policies that allow transaction creation and reading
    - Simplify policy conditions to ensure proper access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;

-- Create new simplified policies
CREATE POLICY "Enable read access for all users"
  ON transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for updates
CREATE POLICY "Enable update access for all users"
  ON transactions
  FOR UPDATE
  TO public
  USING (true);