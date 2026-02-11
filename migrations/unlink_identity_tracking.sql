-- Create unlinked_identities table for tracking disconnected social accounts
-- This allows detection of re-login attempts with previously unlinked accounts

CREATE TABLE IF NOT EXISTS unlinked_identities (
  identity_id text NOT NULL,
  provider text NOT NULL,
  original_user_id uuid NOT NULL,
  original_email text NOT NULL,
  unlinked_at timestamp DEFAULT now(),
  PRIMARY KEY (provider, identity_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_unlinked_identities_lookup 
ON unlinked_identities(provider, identity_id);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_unlinked_identities_user 
ON unlinked_identities(original_user_id);
