-- Tenesta Test Data Setup
-- Run this in Supabase SQL Editor to create test users and data

-- ============================================================================
-- CREATE TEST ORGANIZATION
-- ============================================================================

INSERT INTO organizations (name, type, subscription_tier) 
VALUES ('Test Property Management', 'small_business', 'landlord_pro')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE TEST USERS (AUTH)
-- ============================================================================

-- Note: You'll need to create these users through Supabase Auth first
-- Then update the auth_user_id values below with the actual auth.users.id values

-- Create test users in the users table (update auth_user_id values after creating auth users)
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Get the test organization ID
    SELECT id INTO test_org_id 
    FROM organizations 
    WHERE name = 'Test Property Management';
    
    -- Insert test landlord (you'll need to update auth_user_id)
    INSERT INTO users (
        email, 
        role, 
        organization_id,
        auth_user_id,
        profile
    )
    VALUES (
        'landlord@test.com', 
        'landlord', 
        test_org_id,
        NULL, -- Update this with actual auth.users.id after creating auth user
        jsonb_build_object(
            'full_name', 'John Landlord',
            'phone', '+1234567890',
            'avatar_url', null
        )
    )
    ON CONFLICT (email) DO UPDATE SET
        organization_id = test_org_id,
        profile = EXCLUDED.profile;
    
    -- Insert test tenant (you'll need to update auth_user_id)
    INSERT INTO users (
        email, 
        role, 
        organization_id,
        auth_user_id,
        profile
    )
    VALUES (
        'tenant@test.com', 
        'tenant', 
        test_org_id,
        NULL, -- Update this with actual auth.users.id after creating auth user
        jsonb_build_object(
            'full_name', 'Jane Tenant',
            'phone', '+1987654321',
            'avatar_url', null
        )
    )
    ON CONFLICT (email) DO UPDATE SET
        organization_id = test_org_id,
        profile = EXCLUDED.profile;
    
    -- Insert test admin (you'll need to update auth_user_id)
    INSERT INTO users (
        email, 
        role, 
        organization_id,
        auth_user_id,
        profile
    )
    VALUES (
        'admin@test.com', 
        'admin', 
        test_org_id,
        NULL, -- Update this with actual auth.users.id after creating auth user
        jsonb_build_object(
            'full_name', 'Admin User',
            'phone', '+1555666777',
            'avatar_url', null
        )
    )
    ON CONFLICT (email) DO UPDATE SET
        organization_id = test_org_id,
        profile = EXCLUDED.profile;

    -- Insert test maintenance staff
    INSERT INTO users (
        email, 
        role, 
        organization_id,
        auth_user_id,
        profile
    )
    VALUES (
        'maintenance@test.com', 
        'maintenance', 
        test_org_id,
        NULL, -- Update this with actual auth.users.id after creating auth user
        jsonb_build_object(
            'full_name', 'Mike Maintenance',
            'phone', '+1555888999',
            'specialties', '["plumbing", "electrical"]'
        )
    )
    ON CONFLICT (email) DO UPDATE SET
        organization_id = test_org_id,
        profile = EXCLUDED.profile;
        
    RAISE NOTICE 'Test users created/updated. Remember to:';
    RAISE NOTICE '1. Create auth users in Supabase Auth Dashboard';
    RAISE NOTICE '2. Update auth_user_id values in users table';
END $$;

-- ============================================================================
-- CREATE TEST PROPERTIES
-- ============================================================================

DO $$
DECLARE
    test_landlord_id UUID;
    test_org_id UUID;
    property1_id UUID;
    property2_id UUID;
BEGIN
    -- Get test user and org IDs
    SELECT id INTO test_landlord_id FROM users WHERE email = 'landlord@test.com';
    SELECT id INTO test_org_id FROM organizations WHERE name = 'Test Property Management';
    
    -- Insert test properties
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
        jsonb_build_object(
            'bedrooms', 2,
            'bathrooms', 1,
            'sqft', 800,
            'amenities', '["dishwasher", "laundry", "parking"]',
            'pet_policy', 'Cats allowed'
        ),
        'occupied'
    )
    RETURNING id INTO property1_id;
    
    INSERT INTO properties (
        address, city, state, zip_code, 
        landlord_id, organization_id, 
        rent_amount, security_deposit,
        property_details, status
    )
    VALUES (
        '456 Oak Ave', 'Brooklyn', 'NY', '11201',
        test_landlord_id, test_org_id,
        1800.00, 3600.00,
        jsonb_build_object(
            'bedrooms', 1,
            'bathrooms', 1,
            'sqft', 600,
            'amenities', '["dishwasher", "gym"]',
            'pet_policy', 'No pets'
        ),
        'available'
    )
    RETURNING id INTO property2_id;

    RAISE NOTICE 'Created properties with IDs: %, %', property1_id, property2_id;
END $$;

-- ============================================================================
-- CREATE TEST TENANCY
-- ============================================================================

DO $$
DECLARE
    test_tenant_id UUID;
    test_property_id UUID;
    tenancy_id UUID;
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
        CURRENT_DATE - INTERVAL '30 days', 
        CURRENT_DATE + INTERVAL '335 days',
        'active',
        jsonb_build_object(
            'lease_type', 'standard',
            'pets_allowed', true,
            'smoking_allowed', false,
            'guests_policy', 'Overnight guests allowed up to 14 days',
            'utilities_included', '["water", "trash"]',
            'late_fee', 50.00
        )
    )
    RETURNING id INTO tenancy_id;

    RAISE NOTICE 'Created tenancy with ID: %', tenancy_id;
END $$;

-- ============================================================================
-- CREATE TEST PAYMENTS
-- ============================================================================

DO $$
DECLARE
    test_tenancy_id UUID;
    current_month_payment UUID;
    last_month_payment UUID;
BEGIN
    -- Get test tenancy ID
    SELECT id INTO test_tenancy_id FROM tenancies LIMIT 1;
    
    -- Create current month payment (due)
    INSERT INTO payments (
        tenancy_id, amount, due_date,
        status, payment_method, notes
    )
    VALUES (
        test_tenancy_id, 2500.00, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
        'pending', 'stripe', 'Monthly rent payment'
    )
    RETURNING id INTO current_month_payment;
    
    -- Create last month payment (paid)
    INSERT INTO payments (
        tenancy_id, amount, due_date, paid_date,
        status, payment_method, notes
    )
    VALUES (
        test_tenancy_id, 2500.00, DATE_TRUNC('month', CURRENT_DATE),
        CURRENT_DATE - INTERVAL '2 days',
        'paid', 'stripe', 'Monthly rent payment'
    )
    RETURNING id INTO last_month_payment;

    RAISE NOTICE 'Created payments with IDs: %, %', current_month_payment, last_month_payment;
END $$;

-- ============================================================================
-- CREATE TEST MAINTENANCE REQUEST
-- ============================================================================

DO $$
DECLARE
    test_tenancy_id UUID;
    test_tenant_id UUID;
    maintenance_id UUID;
BEGIN
    -- Get test IDs
    SELECT id INTO test_tenancy_id FROM tenancies LIMIT 1;
    SELECT id INTO test_tenant_id FROM users WHERE email = 'tenant@test.com';
    
    -- Create maintenance request
    INSERT INTO maintenance_requests (
        tenancy_id, requester_id,
        title, description, category, priority,
        location_details, status
    )
    VALUES (
        test_tenancy_id, test_tenant_id,
        'Kitchen Sink Leak', 
        'The kitchen sink has been dripping constantly. It appears to be coming from the faucet connection.',
        'plumbing', 'medium',
        'Kitchen - under sink area',
        'pending'
    )
    RETURNING id INTO maintenance_id;

    RAISE NOTICE 'Created maintenance request with ID: %', maintenance_id;
END $$;

-- ============================================================================
-- CREATE TEST SUPPORT TICKET
-- ============================================================================

DO $$
DECLARE
    test_tenant_id UUID;
    test_org_id UUID;
    ticket_id UUID;
    ticket_num TEXT;
BEGIN
    -- Get test IDs
    SELECT id INTO test_tenant_id FROM users WHERE email = 'tenant@test.com';
    SELECT id INTO test_org_id FROM organizations WHERE name = 'Test Property Management';
    
    -- Generate ticket number
    SELECT generate_ticket_number() INTO ticket_num;
    
    -- Create support ticket
    INSERT INTO support_tickets (
        ticket_number, user_id, organization_id,
        subject, description, category, priority, status
    )
    VALUES (
        ticket_num, test_tenant_id, test_org_id,
        'Login Issues',
        'I am having trouble logging into my account. The password reset email is not arriving.',
        'technical', 'medium', 'open'
    )
    RETURNING id INTO ticket_id;

    RAISE NOTICE 'Created support ticket with ID: % (Number: %)', ticket_id, ticket_num;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show what was created
SELECT 'ORGANIZATIONS' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'USERS', COUNT(*) FROM users
UNION ALL  
SELECT 'PROPERTIES', COUNT(*) FROM properties
UNION ALL
SELECT 'TENANCIES', COUNT(*) FROM tenancies
UNION ALL
SELECT 'PAYMENTS', COUNT(*) FROM payments
UNION ALL
SELECT 'MAINTENANCE_REQUESTS', COUNT(*) FROM maintenance_requests
UNION ALL
SELECT 'SUPPORT_TICKETS', COUNT(*) FROM support_tickets;

-- Show user details
SELECT 
    email, role, 
    profile->>'full_name' as full_name,
    CASE WHEN auth_user_id IS NULL THEN '❌ Missing' ELSE '✅ Set' END as auth_status
FROM users 
ORDER BY role, email;

SELECT '🎉 Test data created successfully!' as status;
SELECT '⚠️  Remember to create auth users and update auth_user_id values!' as reminder;