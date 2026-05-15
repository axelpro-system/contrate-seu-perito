-- Migration 018: Fix profiles id null constraint
-- Add default gen_random_uuid() to profiles.id so inserts without explicit id don't fail.
-- The id still references auth.users(id) for referential integrity.

alter table profiles alter column id set default gen_random_uuid();
