-- OpenPress Schema Migration 006
-- Add Stripe payment columns to orders table

ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN paid_at TEXT;

-- Add payment_method column for tracking how orders were paid
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'stripe';
