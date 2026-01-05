/*
  # Create Transaction History Table

  1. New Tables
    - `transaction_history`
      - `id` (uuid, primary key)
      - `email` (text)
      - `amount` (numeric)
      - `btc_amount` (numeric)
      - `wallet_address` (text)
      - `date` (timestamptz)
      - `synced_at` (timestamptz)

  2. Indexes
    - Add indexes for better query performance
*/

create table if not exists transaction_history (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  amount numeric not null,
  btc_amount numeric not null,
  wallet_address text not null,
  date timestamptz not null,
  synced_at timestamptz not null default now()
);

-- Add indexes for better performance
create index if not exists idx_transaction_history_email on transaction_history(email);
create index if not exists idx_transaction_history_date on transaction_history(date);

-- Enable RLS
alter table transaction_history enable row level security;

-- Create policies
create policy "Enable read access for all users"
  on transaction_history
  for select
  to public
  using (true);

create policy "Enable insert access for service role"
  on transaction_history
  for insert
  to service_role
  with check (true);