/*
  # Add OTP table and functionality

  1. New Tables
    - `email_otps`
      - `id` (uuid, primary key)
      - `email` (text)
      - `code` (text)
      - `expires_at` (timestamp)
      - `verified` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `email_otps` table
    - Add policies for inserting and selecting OTPs
*/

CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert OTPs"
  ON email_otps
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can select OTPs"
  ON email_otps
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX idx_email_otps_email ON email_otps(email);
CREATE INDEX idx_email_otps_code ON email_otps(code);
CREATE INDEX idx_email_otps_expires_at ON email_otps(expires_at);