-- Create email_otps table
CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_code ON email_otps(code);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can insert OTPs" ON email_otps;
    DROP POLICY IF EXISTS "Anyone can select OTPs" ON email_otps;
    DROP POLICY IF EXISTS "Anyone can update OTPs" ON email_otps;
    DROP POLICY IF EXISTS "Anyone can insert email logs" ON email_logs;
    DROP POLICY IF EXISTS "Anyone can select email logs" ON email_logs;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create policies for email_otps
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

CREATE POLICY "Anyone can update OTPs"
  ON email_otps
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for email_logs
CREATE POLICY "Anyone can insert email logs"
  ON email_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can select email logs"
  ON email_logs
  FOR SELECT
  TO public
  USING (true);