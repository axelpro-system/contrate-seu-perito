-- Ensure reviewer_name column exists on reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name text NOT NULL DEFAULT 'Cliente';

-- Set default for existing rows
UPDATE reviews SET reviewer_name = 'Cliente' WHERE reviewer_name IS NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
