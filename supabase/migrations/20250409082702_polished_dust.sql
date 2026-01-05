/*
  # Add KYC Verifications Table

  1. New Tables
    - `kyc_verifications`
      - `id` (uuid, primary key)
      - `verification_id` (text)
      - `applicant_id` (text)
      - `email` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for verification management
*/

CREATE TABLE kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id text NOT NULL,
  applicant_id text NOT NULL,
  email text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_kyc_verifications_email ON kyc_verifications(email);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_verifications_verification_id ON kyc_verifications(verification_id);

-- Create policies
CREATE POLICY "Enable read access for own verifications"
  ON kyc_verifications
  FOR SELECT
  TO public
  USING (email = current_user);

CREATE POLICY "Enable insert access for verifications"
  ON kyc_verifications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update access for own verifications"
  ON kyc_verifications
  FOR UPDATE
  TO public
  USING (email = current_user);