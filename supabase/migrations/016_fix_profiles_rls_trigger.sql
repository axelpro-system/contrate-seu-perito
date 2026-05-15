-- Migration 016: Fix profiles RLS trigger
-- The trigger handle_new_user() inserts into profiles but RLS blocks it
-- because auth.uid() may not match during trigger execution.
-- Solution: Add a policy that allows inserts when the trigger is running,
-- or use security definer properly.

-- Drop and recreate the trigger function with proper security context
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, contact_email, profile_type, account_status, profile_visible)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'profile_type', 'PERITO'), 'PENDING', false);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Add a policy that allows service role and trigger context to insert
-- This policy allows inserts when auth.uid() matches the new row's id
-- OR when called from a security definer function (trigger context)
drop policy if exists "Users can insert their own profile" on profiles;

create policy "Users can insert their own profile" on profiles
  for insert with check (
    auth.uid() = id
    or auth.role() = 'service_role'
  );

-- Also ensure the trigger can bypass RLS by using security definer
-- The security definer function runs with the privileges of the definer (postgres)
-- but RLS still applies. We need to explicitly allow this.

-- Alternative: Disable RLS for the trigger by using a session variable
-- This is the cleanest approach for Supabase triggers
create policy "System can insert profiles" on profiles
  for insert with check (
    current_setting('app.trigger_context', true) = 'true'
  );

-- Update the trigger to set the context
create or replace function public.handle_new_user()
returns trigger as $$
begin
  perform set_config('app.trigger_context', 'true', true);
  insert into public.profiles (id, contact_email, profile_type, account_status, profile_visible)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'profile_type', 'PERITO'), 'PENDING', false);
  return new;
end;
$$ language plpgsql security definer set search_path = public;
