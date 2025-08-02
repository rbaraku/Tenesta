-- Simple RLS fix - drop all policies and create basic ones
-- This prevents recursion by using only auth.uid() comparisons

-- Disable RLS temporarily to clear policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view profiles in same organization" ON users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_select_all" ON users;
DROP POLICY IF EXISTS "org_members_select" ON users;

-- Create simple policies using only auth.uid()
CREATE POLICY "users_own_profile_select" ON users
    FOR SELECT
    USING (auth_user_id = auth.uid());

CREATE POLICY "users_own_profile_update" ON users
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;