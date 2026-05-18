-- ============================================================
-- 1. Clean up duplicate admin RLS policies on profiles
-- ============================================================
-- The old ALL policy used profile_type = 'ADMIN' directly, which
-- causes RLS recursion when querying profiles. The security
-- definer is_admin() function avoids this.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profile_type = 'ADMIN');
$$;

DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Add missing DELETE and INSERT policies for admins
DROP POLICY IF EXISTS admins_delete_profiles ON profiles;
CREATE POLICY admins_delete_profiles ON profiles
  FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS admins_insert_profiles ON profiles;
CREATE POLICY admins_insert_profiles ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- 2. Add CRUD policies for admin on specialties table
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage specialties" ON specialties;
CREATE POLICY "Admins can manage specialties" ON specialties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profile_type = 'ADMIN')
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
