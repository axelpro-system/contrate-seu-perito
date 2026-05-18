-- Create email_logs table for tracking sent notification emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  recipient_user_id uuid REFERENCES profiles(id),
  email_type text NOT NULL,
  subject text NOT NULL,
  body_preview text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_user ON email_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all email logs
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profile_type = 'ADMIN')
  );

-- System can insert (via edge functions or triggers)
DROP POLICY IF EXISTS "System can insert email logs" ON email_logs;
CREATE POLICY "System can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Users can see their own email logs
DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (
    auth.uid() = recipient_user_id
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
