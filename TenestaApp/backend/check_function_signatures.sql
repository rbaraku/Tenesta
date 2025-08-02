-- Check existing function signatures to get correct parameter names
-- Run this FIRST to see what parameter names the functions currently use

SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS parameters,
    pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_user_role',
    'is_property_landlord',
    'is_property_tenant',
    'generate_next_payment',
    'generate_ticket_number',
    'notify_payment_status_change',
    'notify_dispute_status_change',
    'is_valid_email',
    'is_strong_password',
    'is_admin',
    'get_user_organization',
    'is_associated_with_tenancy',
    'is_household_member',
    'can_access_maintenance_request',
    'is_member_of_organization'
)
ORDER BY p.proname;