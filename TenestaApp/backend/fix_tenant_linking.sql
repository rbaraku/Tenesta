-- Fix tenant user linking
-- The auth user exists but database user might not be linked properly

-- Update the tenant user with the correct auth_user_id
UPDATE users 
SET auth_user_id = 'a3b29de5-1dc4-4cd8-8b53-94f091e23ede' 
WHERE email = 'tenant@test.com';

-- Update landlord too just in case
UPDATE users 
SET auth_user_id = 'c07d169c-22e9-40b8-adb6-87be532a7b9b' 
WHERE email = 'landlord@test.com';

-- Verify the linkage
SELECT 
    email,
    role,
    auth_user_id,
    CASE 
        WHEN auth_user_id IS NOT NULL THEN '✅ Linked'
        ELSE '❌ Not Linked'
    END as auth_status
FROM users
WHERE organization_id = '11111111-1111-1111-1111-111111111111'
ORDER BY email;