-- STEP 3: Link Auth Users to Database Users
-- Run this AFTER creating auth users and getting their IDs from Step 1

-- First, let's see the auth user IDs again
SELECT 
    'Auth User IDs:' as info,
    id as auth_user_id,
    email
FROM auth.users 
WHERE email IN (
    'landlord@test.com',
    'tenant@test.com', 
    'admin@test.com',
    'maintenance@test.com'
)
ORDER BY email;

-- Now update the database users with the auth user IDs
-- IMPORTANT: Replace the UUIDs below with the actual auth user IDs from the query above!

-- Example (you'll need to replace these with your actual auth user IDs):
/*
UPDATE users SET auth_user_id = 'YOUR-AUTH-UUID-FOR-ADMIN' WHERE email = 'admin@test.com';
UPDATE users SET auth_user_id = 'YOUR-AUTH-UUID-FOR-LANDLORD' WHERE email = 'landlord@test.com';
UPDATE users SET auth_user_id = 'YOUR-AUTH-UUID-FOR-MAINTENANCE' WHERE email = 'maintenance@test.com';
UPDATE users SET auth_user_id = 'YOUR-AUTH-UUID-FOR-TENANT' WHERE email = 'tenant@test.com';
*/

-- After running the updates above, verify the linkage:
SELECT 
    u.email,
    u.role,
    u.first_name || ' ' || u.last_name as full_name,
    CASE 
        WHEN u.auth_user_id IS NOT NULL THEN '✅ Linked'
        ELSE '❌ Not Linked'
    END as auth_status,
    u.auth_user_id
FROM users u
WHERE u.organization_id = '11111111-1111-1111-1111-111111111111'
ORDER BY u.email;

-- Test authentication function
SELECT 
    u.email,
    get_user_role(u.auth_user_id) as role_from_auth
FROM users u
WHERE u.organization_id = '11111111-1111-1111-1111-111111111111'
AND u.auth_user_id IS NOT NULL;