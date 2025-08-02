-- Fix RLS Policy Recursion in Users Table
-- The error "infinite recursion detected in policy" occurs when policies reference each other or themselves

-- First, let's check current policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Drop existing RLS policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view profiles in same organization" ON users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON users;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy 3: Admins can view all profiles (simplified check)
CREATE POLICY "admins_select_all" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.auth_user_id = auth.uid() 
            AND admin_user.role = 'admin'
        )
    );

-- Policy 4: Organization members can view profiles in same org (careful to avoid recursion)
CREATE POLICY "org_members_select" ON users
    FOR SELECT
    USING (
        organization_id IS NOT NULL 
        AND organization_id = (
            SELECT u.organization_id 
            FROM users u 
            WHERE u.auth_user_id = auth.uid()
            LIMIT 1
        )
    );

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;