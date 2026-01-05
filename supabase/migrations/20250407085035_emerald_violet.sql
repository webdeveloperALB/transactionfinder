-- Drop existing table if it exists
drop table if exists "TransactionHistory";

-- Create TransactionHistory table with the correct structure
create table "TransactionHistory" (
  id int8 primary key generated always as identity,
  created_at timestamptz default now(),
  "thType" text,
  "thDetails" text,
  "thPoi" text,
  "thStatus" text,
  "thEmail" text
);

-- Add indexes for better performance
create index if not exists idx_transaction_history_email on "TransactionHistory"("thEmail");
create index if not exists idx_transaction_history_created_at on "TransactionHistory"(created_at);
create index if not exists idx_transaction_history_status on "TransactionHistory"("thStatus");

-- Enable RLS
alter table "TransactionHistory" enable row level security;

-- Create policies
create policy "Enable read access for all users"
  on "TransactionHistory"
  for select
  to public
  using (true);

create policy "Enable insert access for service role"
  on "TransactionHistory"
  for insert
  to service_role
  with check (true);