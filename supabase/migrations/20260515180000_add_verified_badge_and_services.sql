-- Add verification and featured badges to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured boolean default false;

-- Create expert services / pricing table
CREATE TABLE IF NOT EXISTS expert_services (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid references profiles(id) on delete cascade not null,
  service_name text not null,
  description text,
  base_price numeric,
  price_unit text default 'hour' check (price_unit in ('hour', 'report', 'consultation', 'document', 'analysis', 'fixed')),
  currency text default 'BRL',
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expert_services_expert_id ON expert_services(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_services_active ON expert_services(is_active);

-- RLS
ALTER TABLE expert_services ENABLE ROW LEVEL SECURITY;

-- Anyone can read active services of public experts
CREATE POLICY "Public can view active services" ON expert_services
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = expert_services.expert_id
      AND p.profile_type = 'PERITO'
      AND p.account_status = 'ACTIVE'
      AND p.profile_visible = true
    )
  );

-- Experts can CRUD their own services
CREATE POLICY "Experts can manage own services" ON expert_services
  FOR ALL USING (expert_id = auth.uid())
  WITH CHECK (expert_id = auth.uid());

-- Admins can manage all services
CREATE POLICY "Admins can manage all services" ON expert_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profile_type = 'ADMIN'
    )
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_expert_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expert_services_updated_at ON expert_services;
CREATE TRIGGER trg_expert_services_updated_at
  BEFORE UPDATE ON expert_services
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_services_updated_at();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
