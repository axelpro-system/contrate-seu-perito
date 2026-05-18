-- Create appointments table for booking between client and expert
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  expert_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  cancelled_by uuid REFERENCES profiles(id),
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_expert_date ON appointments(expert_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_quote ON appointments(quote_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Experts can view their own appointments
DROP POLICY IF EXISTS "Experts can view own appointments" ON appointments;
CREATE POLICY "Experts can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = expert_id);

-- Clients can view their own appointments
DROP POLICY IF EXISTS "Clients can view own appointments" ON appointments;
CREATE POLICY "Clients can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = client_id);

-- Authenticated users can create appointments (they're participants)
DROP POLICY IF EXISTS "Participants can create appointments" ON appointments;
CREATE POLICY "Participants can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() = expert_id OR auth.uid() = client_id
  );

-- Participants can update appointments
DROP POLICY IF EXISTS "Participants can update appointments" ON appointments;
CREATE POLICY "Participants can update appointments" ON appointments
  FOR UPDATE USING (
    auth.uid() = expert_id OR auth.uid() = client_id
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
