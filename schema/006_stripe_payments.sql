-- OpenPress Schema Migration 006
-- Add Stripe payment columns to orders table

ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'stripe';
-- Note: paid_at may already exist from prior schema; ignore if duplicate
