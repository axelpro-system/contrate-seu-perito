-- Create leads table if not exists
CREATE TABLE IF NOT EXISTS leads (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id),
  client_id uuid not null references profiles(id),
  message text not null,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create leads" ON leads;
CREATE POLICY "Users can create leads" ON leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Experts can view their leads" ON leads;
CREATE POLICY "Experts can view their leads" ON leads FOR SELECT USING (auth.uid() = expert_id);
DROP POLICY IF EXISTS "Clients can view their leads" ON leads;
CREATE POLICY "Clients can view their leads" ON leads FOR SELECT USING (auth.uid() = client_id);

-- Fix reviews table missing columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES profiles(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

-- Ensure account_status enum has PENDING
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING' AND enumtypid = 'account_status'::regtype) THEN
    ALTER TYPE account_status ADD VALUE 'PENDING';
  END IF;
END $$;

-- Add approved_at and approved_by to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);

-- Create service_completions table if not exists
CREATE TABLE IF NOT EXISTS service_completions (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid not null references quotes(id),
  expert_id uuid not null references profiles(id),
  client_id uuid not null references profiles(id),
  completed_at timestamp with time zone default now(),
  review_reminder_sent boolean default false,
  review_id uuid references reviews(id)
);

ALTER TABLE service_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their service completions" ON service_completions;
CREATE POLICY "Users can view their service completions" ON service_completions FOR SELECT USING (
  auth.uid() = expert_id OR auth.uid() = client_id
);
DROP POLICY IF EXISTS "System can create service completions" ON service_completions;
CREATE POLICY "System can create service completions" ON service_completions FOR INSERT WITH CHECK (true);

-- Trigger to create service completion when quote is approved
CREATE OR REPLACE FUNCTION create_service_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO service_completions (quote_id, expert_id, client_id)
    VALUES (NEW.id, NEW.expert_id, NEW.requester_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quote_approved ON quotes;
CREATE TRIGGER quote_approved AFTER UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION create_service_completion();

-- Update RLS for profiles to handle PENDING status
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (
    profile_type = 'PERITO'
    AND account_status = 'ACTIVE'
    AND profile_visible = true
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
