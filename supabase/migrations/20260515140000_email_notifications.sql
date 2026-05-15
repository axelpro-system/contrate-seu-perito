-- Email notifications are triggered from the frontend via Supabase Edge Function
-- See: supabase/functions/send-email/index.ts
-- Edge function deployed on project oedgzprzkcvtiybhcckm

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
