-- Ensure all tables from schema.sql exist in remote DB
-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid not null references quotes(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes q WHERE q.id = messages.quote_id AND (q.expert_id = auth.uid() OR q.requester_id = auth.uid()))
);
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quotes q WHERE q.id = messages.quote_id AND (q.expert_id = auth.uid() OR q.requester_id = auth.uid()))
);
DROP POLICY IF EXISTS "Participants can mark messages as read" ON messages;
CREATE POLICY "Participants can mark messages as read" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM quotes q WHERE q.id = messages.quote_id AND (q.expert_id = auth.uid() OR q.requester_id = auth.uid()))
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid default gen_random_uuid() primary key,
  client_id uuid not null references profiles(id) on delete cascade,
  expert_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(client_id, expert_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can manage own favorites" ON favorites;
CREATE POLICY "Clients can manage own favorites" ON favorites FOR ALL USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Anyone can view favorites" ON favorites;
CREATE POLICY "Anyone can view favorites" ON favorites FOR SELECT USING (true);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean default true,
  created_at timestamp with time zone default now(),
  unique(expert_id, day_of_week, start_time)
);
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Experts can manage own availability" ON availability;
CREATE POLICY "Experts can manage own availability" ON availability FOR ALL USING (auth.uid() = expert_id);
DROP POLICY IF EXISTS "Anyone can view availability" ON availability;
CREATE POLICY "Anyone can view availability" ON availability FOR SELECT USING (true);

-- Portfolio items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_type text,
  created_at timestamp with time zone default now()
);
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Experts can manage own portfolio" ON portfolio_items;
CREATE POLICY "Experts can manage own portfolio" ON portfolio_items FOR ALL USING (auth.uid() = expert_id);
DROP POLICY IF EXISTS "Anyone can view portfolio" ON portfolio_items;
CREATE POLICY "Anyone can view portfolio" ON portfolio_items FOR SELECT USING (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
