-- Create SECURITY DEFINER function to check admin role (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profile_type = 'ADMIN');
$$;

-- Allow admins to view all profiles
DROP POLICY IF EXISTS admins_view_profiles ON profiles;
CREATE POLICY admins_view_profiles ON profiles
  FOR SELECT USING (is_admin());

-- Allow admins to update any profile
DROP POLICY IF EXISTS admins_update_profiles ON profiles;
CREATE POLICY admins_update_profiles ON profiles
  FOR UPDATE USING (is_admin());
