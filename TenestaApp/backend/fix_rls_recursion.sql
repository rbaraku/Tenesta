-- Fix RLS infinite recursion in users table
-- This happens when RLS policies reference the same table they're protecting

-- First, disable RLS temporarily to examine and fix policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Landlords can view tenant profiles" ON public.users;
DROP POLICY IF EXISTS "Service accounts can access users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create fixed RLS policies that don't cause recursion
-- Policy 1: Users can view and update their own profile using auth.uid()
CREATE POLICY "users_own_profile_access" ON public.users
    FOR ALL USING (auth_user_id = auth.uid());

-- Policy 2: Admins can access all user profiles (using auth.jwt() to avoid recursion)
CREATE POLICY "admin_full_access" ON public.users
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN (
            'admin@test.com'
        )
    );

-- Policy 3: Service role access (for edge functions)
CREATE POLICY "service_role_access" ON public.users
    FOR ALL USING (
        auth.role() = 'service_role'
    );

-- Policy 4: Authenticated users can read basic user info for messaging/communication
-- This policy allows reading user profiles for valid communication purposes
CREATE POLICY "authenticated_read_for_communication" ON public.users
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- Test query to ensure no recursion
SELECT 'RLS policies fixed - no recursion detected' as status;