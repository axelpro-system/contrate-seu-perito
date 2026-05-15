-- ============================================================
-- ENUM TYPES
-- ============================================================
create type profile_type as enum ('PERITO', 'CONTRATANTE', 'ADMIN');
create type account_status as enum ('ACTIVE', 'BLOCKED', 'PENDING', 'REJECTED', 'SUSPENDED');
create type quote_status as enum ('submitted', 'under_review', 'approved', 'rejected');

-- ============================================================
-- TABLES
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  full_name text,
  email text,
  avatar_url text,
  specialty text,
  location text,
  city text,
  state text,
  phone text,
  bio text,
  certifications jsonb default '[]',
  contact_email text,
  contact_phone text,
  curriculum_url text,
  cv_url text,
  expertise_areas text,
  rating numeric default 0,
  reviews_count integer default 0,
  hourly_rate numeric,
  availability_status text default 'available',
  linkedin_url text,
  social_linkedin text,
  social_website text,
  website_url text,
  profile_visible boolean default false,
  profile_type profile_type default 'PERITO',
  account_status account_status default 'PENDING',
  approved_at timestamp with time zone,
  approved_by uuid references profiles(id),
  tags text[] default '{}',
  credential_tags text[] default '{}',
  specialty_demands text[] default '{}',
  work_types text[] default '{}',
  registration_number text,
  is_verified boolean default false,
  is_featured boolean default false,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  constraint profiles_contact_email_key unique (contact_email)
);

alter table profiles enable row level security;

-- Public profiles: only ACTIVE + visible experts
create policy "Public profiles are viewable by everyone" on profiles
  for select using (
    profile_type = 'PERITO'
    and account_status = 'ACTIVE'
    and profile_visible = true
  );

-- Authenticated users can view all profiles (including private fields)
create policy "Authenticated users can view profiles" on profiles
  for select using (auth.uid() is not null);

-- Users can insert their own profile
create policy "Enable insert for new users" on profiles
  for insert with check (true);

-- Users can update own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Admins can update any profile (for approval)
create policy "Admins can manage profiles" on profiles
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.profile_type = 'ADMIN')
  );

-- Quotes
create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id),
  requester_id uuid references profiles(id),
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  case_description text not null,
  status quote_status default 'submitted',
  proposed_value numeric,
  proposed_deadline text,
  expert_notes text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table quotes enable row level security;

create policy "Anyone can create quotes" on quotes for insert with check (true);
create policy "Users can view their sent quotes" on quotes for select using (auth.uid() = requester_id);
create policy "Experts can view received quotes" on quotes for select using (auth.uid() = expert_id);
create policy "Experts can update their quotes" on quotes for update using (auth.uid() = expert_id);
create policy "Requesters can update quote status" on quotes for update using (auth.uid() = requester_id);

-- Specialties
create table if not exists specialties (
  id uuid default gen_random_uuid() primary key,
  label text not null unique,
  active boolean default true,
  created_at timestamp with time zone default now()
);

alter table specialties enable row level security;
create policy "Anyone can read specialties" on specialties for select using (true);

-- Certificates
create table if not exists certificates (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  name varchar(255) not null,
  issuing_organization varchar(255) not null,
  issue_date date not null,
  expiration_date date,
  credential_id varchar(255),
  credential_url text,
  description text,
  document_url text,
  created_at timestamp with time zone default now()
);

alter table certificates enable row level security;
create policy "Users can manage own certificates" on certificates for all using (auth.uid() = profile_id);
create policy "Anyone can view certificates" on certificates for select using (true);

-- Audit logs
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

alter table audit_logs enable row level security;
create policy "Admin can view audit logs" on audit_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and profile_type = 'ADMIN')
);

-- Contact submissions
create table if not exists contact_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

alter table contact_submissions enable row level security;
create policy "Anyone can submit contact" on contact_submissions for insert with check (true);

-- Leads
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id),
  client_id uuid not null references profiles(id),
  message text not null,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table leads enable row level security;
create policy "Users can create leads" on leads for insert with check (true);
create policy "Experts can view their leads" on leads for select using (auth.uid() = expert_id);
create policy "Clients can view their leads" on leads for select using (auth.uid() = client_id);

-- Reviews
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id),
  client_id uuid not null references profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  lead_id uuid references leads(id),
  created_at timestamp with time zone default now()
);

alter table reviews enable row level security;
create policy "Anyone can create reviews" on reviews for insert with check (true);
create policy "Anyone can view reviews" on reviews for select using (true);

-- Service completions (for post-service review flow)
create table if not exists service_completions (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid not null references quotes(id),
  expert_id uuid not null references profiles(id),
  client_id uuid not null references profiles(id),
  completed_at timestamp with time zone default now(),
  review_reminder_sent boolean default false,
  review_id uuid references reviews(id)
);

alter table service_completions enable row level security;
create policy "Users can view their service completions" on service_completions for select using (
  auth.uid() = expert_id or auth.uid() = client_id
);
create policy "System can create service completions" on service_completions for insert with check (true);

-- Messages (Chat)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid not null references quotes(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table messages enable row level security;

create policy "Participants can view messages" on messages for select using (
  exists (
    select 1 from quotes q
    where q.id = messages.quote_id
    and (q.expert_id = auth.uid() or q.requester_id = auth.uid())
  )
);

create policy "Participants can send messages" on messages for insert with check (
  exists (
    select 1 from quotes q
    where q.id = messages.quote_id
    and (q.expert_id = auth.uid() or q.requester_id = auth.uid())
  )
);

create policy "Participants can mark messages as read" on messages for update using (
  exists (
    select 1 from quotes q
    where q.id = messages.quote_id
    and (q.expert_id = auth.uid() or q.requester_id = auth.uid())
  )
);

-- Favorites
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  client_id uuid not null references profiles(id) on delete cascade,
  expert_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(client_id, expert_id)
);

alter table favorites enable row level security;

create policy "Clients can manage own favorites" on favorites for all using (auth.uid() = client_id);

create policy "Anyone can view favorites" on favorites for select using (true);

-- Availability
create table if not exists availability (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean default true,
  created_at timestamp with time zone default now(),
  unique(expert_id, day_of_week, start_time)
);

alter table availability enable row level security;

create policy "Experts can manage own availability" on availability for all using (auth.uid() = expert_id);

create policy "Anyone can view availability" on availability for select using (true);

-- Portfolio
create table if not exists portfolio_items (
  id uuid default gen_random_uuid() primary key,
  expert_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_type text,
  created_at timestamp with time zone default now()
);

alter table portfolio_items enable row level security;

create policy "Experts can manage own portfolio" on portfolio_items for all using (auth.uid() = expert_id);

create policy "Anyone can view portfolio" on portfolio_items for select using (true);

-- Notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table notifications enable row level security;

create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);

create policy "System can create notifications" on notifications for insert with check (true);

create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);

-- Expert Services / Pricing
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

CREATE INDEX IF NOT EXISTS idx_expert_services_expert_id ON expert_services(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_services_active ON expert_services(is_active);

ALTER TABLE expert_services ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Experts can manage own services" ON expert_services
  FOR ALL USING (expert_id = auth.uid())
  WITH CHECK (expert_id = auth.uid());

CREATE POLICY "Admins can manage all services" ON expert_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profile_type = 'ADMIN'
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- avatars: public bucket for profile photos
-- curriculums: private bucket for CV documents

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, contact_email, profile_type, account_status, profile_visible)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'profile_type', 'PERITO'), 'PENDING', false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger quotes_updated_at before update on quotes
  for each row execute function update_updated_at();

create trigger expert_services_updated_at before update on expert_services
  for each row execute function update_updated_at();

-- Featured experts with random ordering
create or replace function get_featured_experts(limit_count integer default 6)
returns setof profiles as $$
begin
  return query
  select * from profiles
  where profile_type = 'PERITO' and profile_visible = true and account_status = 'ACTIVE'
  order by random()
  limit limit_count;
end;
$$ language plpgsql stable;

-- Auto-update expert rating
create or replace function update_expert_rating()
returns trigger as $$
begin
  update profiles
  set rating = (select coalesce(avg(rating), 0) from reviews where expert_id = NEW.expert_id),
      reviews_count = (select count(*) from reviews where expert_id = NEW.expert_id)
  where id = NEW.expert_id;
  return NEW;
end;
$$ language plpgsql;

create trigger review_created after insert on reviews
  for each row execute function update_expert_rating();

-- Create service completion when quote is approved
create or replace function create_service_completion()
returns trigger as $$
begin
  if NEW.status = 'approved' and OLD.status != 'approved' then
    insert into service_completions (quote_id, expert_id, client_id)
    values (NEW.id, NEW.expert_id, NEW.requester_id);
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger quote_approved after update on quotes
  for each row execute function create_service_completion();
