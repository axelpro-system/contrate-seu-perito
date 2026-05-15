-- Add missing columns to profiles table that frontend components expect
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_linkedin text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags text[] default '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications jsonb default '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credential_tags text[] default '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty_demands text[] default '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_types text[] default '{}';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
