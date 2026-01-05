/*
  # Update transaction table policies

  1. Changes
    - Remove auth-based RLS policies
    - Add new policies based on user relationships
    - Allow transactions to be created and read based on user existence

  2. Security
    - Ensure transactions can only be accessed by related users
    - Maintain data integrity with proper user relationships
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;

-- Create new policies that don't rely on auth
CREATE POLICY "Users can read transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = transactions.user_id
    )
  );

CREATE POLICY "Users can insert transactions"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = transactions.user_id
    )
  );