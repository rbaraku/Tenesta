-- STEP 1: Create Test Authentication Users
-- Run this in Supabase SQL Editor with postgres role
-- This creates auth users that can actually log in

-- Note: You'll need to manually create these users in Supabase Dashboard > Authentication > Users
-- OR use the SQL below if you have the auth schema access

-- For manual creation in Supabase Dashboard, create these users:
-- 1. landlord@test.com - Password: Test123!@#
-- 2. tenant@test.com - Password: Test123!@#  
-- 3. admin@test.com - Password: Test123!@#
-- 4. maintenance@test.com - Password: Test123!@#

-- After creating auth users manually, run this query to get their IDs:
SELECT 
    id as auth_user_id,
    email,
    created_at
FROM auth.users 
WHERE email IN (
    'landlord@test.com',
    'tenant@test.com', 
    'admin@test.com',
    'maintenance@test.com'
)
ORDER BY email;

-- Save these IDs for Step 3!