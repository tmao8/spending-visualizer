-- Run this script in your Supabase SQL Editor

-- 1. Create the plaid_connections table
CREATE TABLE IF NOT EXISTS plaid_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  next_cursor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure the table with RLS
ALTER TABLE plaid_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plaid connections"
  ON plaid_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plaid connections"
  ON plaid_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid connections"
  ON plaid_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Alter the transactions table to support Plaid
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plaid_account_id TEXT;

-- Create an index to speed up lookups during sync
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON transactions(plaid_transaction_id);

-- Optional: If you want to delete transactions when their associated account is removed
-- ALTER TABLE transactions ADD CONSTRAINT fk_plaid_account FOREIGN KEY (plaid_account_id) REFERENCES plaid_connections(item_id) ON DELETE SET NULL;
