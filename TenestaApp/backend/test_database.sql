-- Tenesta Database Testing Script
-- Test all tables, RLS policies, and core functionality

-- ============================================================================
-- BASIC TABLE STRUCTURE TESTS
-- ============================================================================

-- Test 1: Verify all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'organizations', 'users', 'properties', 'tenancies', 
        'payments', 'documents', 'disputes', 'messages', 
        'notifications', 'notes'
    )
ORDER BY table_name;

-- Test 2: Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'organizations', 'users', 'properties', 'tenancies', 
        'payments', 'documents', 'disputes', 'messages', 
        'notifications', 'notes'
    )
ORDER BY tablename;

-- Test 3: List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SAMPLE DATA INSERTION TESTS
-- ============================================================================

-- Create test organization
INSERT INTO organizations (name, type, subscription_tier) 
VALUES ('Test Property Management', 'small_business', 'landlord_pro')
ON CONFLICT DO NOTHING
RETURNING id, name;

-- Create test users
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Get the test organization ID
    SELECT id INTO test_org_id 
    FROM organizations 
    WHERE name = 'Test Property Management';
    
    -- Insert test landlord
    INSERT INTO users (email, role, organization_id, profile)
    VALUES (
        'landlord@test.com', 
        'landlord', 
        test_org_id,
        '{"full_name": "John Landlord", "phone": "+1234567890"}'
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert test tenant
    INSERT INTO users (email, role, organization_id, profile)
    VALUES (
        'tenant@test.com', 
        'tenant', 
        test_org_id,
        '{"full_name": "Jane Tenant", "phone": "+1987654321"}'
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert test admin
    INSERT INTO users (email, role, organization_id, profile)
    VALUES (
        'admin@test.com', 
        'admin', 
        test_org_id,
        '{"full_name": "Admin User", "phone": "+1555666777"}'
    )
    ON CONFLICT (email) DO NOTHING;
END $$;

-- Create test property
DO $$
DECLARE
    test_landlord_id UUID;
    test_org_id UUID;
BEGIN
    -- Get test user IDs
    SELECT id INTO test_landlord_id FROM users WHERE email = 'landlord@test.com';
    SELECT id INTO test_org_id FROM organizations WHERE name = 'Test Property Management';
    
    -- Insert test property
    INSERT INTO properties (
        address, city, state, zip_code, 
        landlord_id, organization_id, 
        rent_amount, security_deposit,
        property_details, status
    )
    VALUES (
        '123 Main St', 'New York', 'NY', '10001',
        test_landlord_id, test_org_id,
        2500.00, 5000.00,
        '{"bedrooms": 2, "bathrooms": 1, "sqft": 800}',
        'available'
    )
    ON CONFLICT DO NOTHING
    RETURNING id, address;
END $$;

-- Create test tenancy
DO $$
DECLARE
    test_tenant_id UUID;
    test_property_id UUID;
BEGIN
    -- Get test IDs
    SELECT id INTO test_tenant_id FROM users WHERE email = 'tenant@test.com';
    SELECT id INTO test_property_id FROM properties WHERE address = '123 Main St';
    
    -- Insert test tenancy
    INSERT INTO tenancies (
        tenant_id, property_id, 
        rent_amount, security_deposit,
        lease_start, lease_end,
        status, lease_terms
    )
    VALUES (
        test_tenant_id, test_property_id,
        2500.00, 5000.00,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year',
        'active',
        '{"lease_type": "standard", "pets_allowed": false}'
    )
    ON CONFLICT DO NOTHING
    RETURNING id, status;
END $$;

-- Create test payment
DO $$
DECLARE
    test_tenancy_id UUID;
BEGIN
    -- Get test tenancy ID
    SELECT id INTO test_tenancy_id FROM tenancies LIMIT 1;
    
    -- Insert test payment
    INSERT INTO payments (
        tenancy_id, amount, due_date,
        status, payment_method, notes
    )
    VALUES (
        test_tenancy_id, 2500.00, CURRENT_DATE + INTERVAL '1 month',
        'pending', 'stripe', 'Monthly rent payment'
    )
    ON CONFLICT DO NOTHING
    RETURNING id, amount, status;
END $$;

-- ============================================================================
-- RLS POLICY TESTS
-- ============================================================================

-- Test 4: Verify users can only see appropriate data
-- (This would need to be run with actual authenticated users)

SELECT 'Testing basic data insertion completed successfully' as test_status;

-- Count records in each table
SELECT 
    'organizations' as table_name, COUNT(*) as record_count 
FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'tenancies', COUNT(*) FROM tenancies
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'disputes', COUNT(*) FROM disputes
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'notes', COUNT(*) FROM notes;

-- ============================================================================
-- HELPER FUNCTION TESTS
-- ============================================================================

-- Test helper functions with sample data
DO $$
DECLARE
    test_user_id UUID;
    test_property_id UUID;
    test_tenancy_id UUID;
    is_admin_result BOOLEAN;
    user_org_id UUID;
    is_landlord_result BOOLEAN;
    is_tenant_result BOOLEAN;
BEGIN
    -- Get test IDs
    SELECT id INTO test_user_id FROM users WHERE email = 'admin@test.com';
    SELECT id INTO test_property_id FROM properties LIMIT 1;
    SELECT id INTO test_tenancy_id FROM tenancies LIMIT 1;
    
    -- Test helper functions
    SELECT is_admin(test_user_id) INTO is_admin_result;
    SELECT get_user_organization(test_user_id) INTO user_org_id;
    SELECT is_property_landlord(test_user_id, test_property_id) INTO is_landlord_result;
    SELECT is_property_tenant(test_user_id, test_property_id) INTO is_tenant_result;
    
    -- Output results
    RAISE NOTICE 'Helper function test results:';
    RAISE NOTICE 'is_admin: %', is_admin_result;
    RAISE NOTICE 'user_org_id: %', user_org_id;
    RAISE NOTICE 'is_landlord: %', is_landlord_result;
    RAISE NOTICE 'is_tenant: %', is_tenant_result;
END $$;

-- ============================================================================
-- RELATIONSHIP TESTS
-- ============================================================================

-- Test 5: Verify relationships work correctly
SELECT 
    u.email as tenant_email,
    p.address as property_address,
    t.rent_amount,
    t.status as tenancy_status,
    l.email as landlord_email
FROM tenancies t
JOIN users u ON u.id = t.tenant_id
JOIN properties p ON p.id = t.property_id
JOIN users l ON l.id = p.landlord_id
WHERE t.status = 'active';

-- Test 6: Verify payment relationships
SELECT 
    u.email as tenant_email,
    p.address as property_address,
    pay.amount,
    pay.due_date,
    pay.status as payment_status
FROM payments pay
JOIN tenancies t ON t.id = pay.tenancy_id
JOIN users u ON u.id = t.tenant_id
JOIN properties p ON p.id = t.property_id;

-- ============================================================================
-- CONSTRAINT TESTS
-- ============================================================================

-- Test 7: Try to insert invalid data (should fail)
-- Uncomment to test constraints:

/*
-- This should fail due to invalid role
INSERT INTO users (email, role, organization_id) 
VALUES ('invalid@test.com', 'invalid_role', (SELECT id FROM organizations LIMIT 1));

-- This should fail due to invalid payment status
INSERT INTO payments (tenancy_id, amount, due_date, status)
VALUES ((SELECT id FROM tenancies LIMIT 1), 1000.00, CURRENT_DATE, 'invalid_status');
*/

SELECT 'All database tests completed!' as final_status;