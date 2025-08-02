-- STEP 2: Create Test Database Data
-- Run this in Supabase SQL Editor with postgres role
-- This creates all the test data needed for development

-- ============================================================================
-- CLEAR EXISTING TEST DATA (Optional - be careful in production!)
-- ============================================================================
-- Uncomment these lines if you want to start fresh:
/*
DELETE FROM payments WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM tenancies WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM properties WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM users WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM organizations WHERE id = '11111111-1111-1111-1111-111111111111';
*/

-- ============================================================================
-- CREATE TEST ORGANIZATION
-- ============================================================================
INSERT INTO organizations (
    id, 
    name, 
    type, 
    subscription_tier, 
    settings,
    created_at, 
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Property Management LLC', 
    'small_business', 
    'landlord_pro',
    jsonb_build_object(
        'features', jsonb_build_object(
            'max_properties', 100,
            'max_users', 20,
            'ai_features', true,
            'white_label', false
        ),
        'branding', jsonb_build_object(
            'primary_color', '#2563eb',
            'logo_url', null
        )
    ),
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- CREATE DATABASE USERS (without auth_user_id for now)
-- ============================================================================
INSERT INTO users (
    id, 
    email, 
    role, 
    organization_id,
    profile,
    created_at, 
    updated_at
) VALUES
    -- Landlord user
    (
        '22222222-2222-2222-2222-222222222222', 
        'landlord@test.com', 
        'landlord', 
        '11111111-1111-1111-1111-111111111111',
        jsonb_build_object(
            'first_name', 'John',
            'last_name', 'Landlord',
            'phone', '+1234567890',
            'bio', 'Experienced property owner with 10+ years in real estate',
            'preferences', jsonb_build_object(
                'notifications', jsonb_build_object(
                    'email', true,
                    'push', true,
                    'sms', false
                ),
                'dashboard_layout', 'grid'
            )
        ),
        NOW(), 
        NOW()
    ),
    -- Tenant user
    (
        '33333333-3333-3333-3333-333333333333', 
        'tenant@test.com', 
        'tenant', 
        '11111111-1111-1111-1111-111111111111',
        jsonb_build_object(
            'first_name', 'Jane',
            'last_name', 'Tenant',
            'phone', '+1234567891',
            'emergency_contact', jsonb_build_object(
                'name', 'Mary Tenant',
                'phone', '+1234567899',
                'relationship', 'Mother'
            )
        ),
        NOW(), 
        NOW()
    ),
    -- Admin user
    (
        '44444444-4444-4444-4444-444444444444', 
        'admin@test.com', 
        'admin', 
        '11111111-1111-1111-1111-111111111111',
        jsonb_build_object(
            'first_name', 'Admin',
            'last_name', 'User',
            'phone', '+1234567892',
            'permissions', jsonb_build_array(
                'manage_users',
                'manage_properties',
                'view_financials',
                'manage_organization'
            )
        ),
        NOW(), 
        NOW()
    ),
    -- Maintenance staff user
    (
        '55555555-5555-5555-5555-555555555555', 
        'maintenance@test.com', 
        'staff', 
        '11111111-1111-1111-1111-111111111111',
        jsonb_build_object(
            'first_name', 'Mike',
            'last_name', 'Maintenance',
            'phone', '+1234567893',
            'skills', jsonb_build_array('plumbing', 'electrical', 'hvac'),
            'availability', 'weekdays'
        ),
        NOW(), 
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- CREATE TEST PROPERTIES
-- ============================================================================
INSERT INTO properties (
    id, 
    landlord_id, 
    organization_id, 
    name, 
    address, 
    city, 
    state, 
    zip_code, 
    country,
    property_type, 
    bedrooms, 
    bathrooms, 
    square_feet, 
    rent_amount,
    security_deposit_amount,
    description,
    amenities,
    status,
    created_at, 
    updated_at
) VALUES
    -- Property 1: Modern Apartment
    (
        '66666666-6666-6666-6666-666666666666', 
        '22222222-2222-2222-2222-222222222222', 
        '11111111-1111-1111-1111-111111111111', 
        'Sunset View Apartment 101', 
        '123 Test Street, Apt 101', 
        'San Francisco', 
        'CA', 
        '94105',
        'US',
        'apartment', 
        2, 
        1, 
        850, 
        2500.00,
        5000.00,
        'Modern 2BR apartment with stunning city views. Recently renovated kitchen with stainless steel appliances.',
        jsonb_build_array('parking', 'gym', 'pool', 'laundry_in_unit', 'balcony'),
        'occupied',
        NOW(), 
        NOW()
    ),
    -- Property 2: Family House
    (
        '77777777-7777-7777-7777-777777777777',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'Green Valley House',
        '456 Oak Avenue',
        'San Francisco',
        'CA',
        '94110',
        'US',
        'house',
        3,
        2,
        1500,
        3500.00,
        7000.00,
        'Spacious family home with backyard and garage. Great neighborhood, close to schools.',
        jsonb_build_array('garage', 'backyard', 'washer_dryer', 'dishwasher', 'central_heating'),
        'available',
        NOW(),
        NOW()
    ),
    -- Property 3: Studio
    (
        '88888888-8888-8888-8888-888888888888',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'Downtown Studio 505',
        '789 Market Street, Unit 505',
        'San Francisco',
        'CA',
        '94103',
        'US',
        'studio',
        0,
        1,
        500,
        1800.00,
        3600.00,
        'Cozy studio in the heart of downtown. Perfect for professionals. All utilities included.',
        jsonb_build_array('utilities_included', 'furnished', 'doorman', 'elevator'),
        'maintenance',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- CREATE TEST TENANCIES
-- ============================================================================
INSERT INTO tenancies (
    id, 
    tenant_id, 
    property_id, 
    organization_id,
    lease_start, 
    lease_end,
    move_in_date,
    rent_amount, 
    security_deposit,
    payment_day,
    status,
    lease_terms,
    created_at, 
    updated_at
) VALUES
    -- Active tenancy for Jane Tenant
    (
        '99999999-9999-9999-9999-999999999999', 
        '33333333-3333-3333-3333-333333333333', 
        '66666666-6666-6666-6666-666666666666', 
        '11111111-1111-1111-1111-111111111111',
        '2024-01-01', 
        '2024-12-31',
        '2024-01-01',
        2500.00, 
        5000.00,
        1, -- Rent due on 1st of each month
        'active',
        jsonb_build_object(
            'pets_allowed', false,
            'max_occupants', 4,
            'parking_included', true,
            'utilities', jsonb_build_object(
                'water', 'included',
                'gas', 'tenant_pays',
                'electric', 'tenant_pays',
                'trash', 'included'
            ),
            'late_fee', 50.00,
            'grace_period_days', 5
        ),
        NOW(), 
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- CREATE TEST PAYMENTS
-- ============================================================================
INSERT INTO payments (
    id, 
    tenancy_id, 
    organization_id, 
    amount, 
    due_date,
    payment_date,
    payment_method,
    transaction_id,
    status,
    payment_type,
    notes,
    created_at, 
    updated_at
) VALUES
    -- Previous paid payments
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
        '99999999-9999-9999-9999-999999999999', 
        '11111111-1111-1111-1111-111111111111', 
        2500.00, 
        '2024-01-01',
        '2024-01-01',
        'bank_transfer',
        'txn_1234567890',
        'paid',
        'rent',
        'January rent - paid on time',
        '2024-01-01', 
        '2024-01-01'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
        '99999999-9999-9999-9999-999999999999', 
        '11111111-1111-1111-1111-111111111111', 
        2500.00, 
        '2024-02-01',
        '2024-02-03',
        'credit_card',
        'txn_2345678901',
        'paid',
        'rent',
        'February rent - paid within grace period',
        '2024-02-01', 
        '2024-02-03'
    ),
    -- Current month pending
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc', 
        '99999999-9999-9999-9999-999999999999', 
        '11111111-1111-1111-1111-111111111111', 
        2500.00, 
        '2024-03-01',
        NULL,
        NULL,
        NULL,
        'pending',
        'rent',
        NULL,
        '2024-02-15', 
        '2024-02-15'
    ),
    -- Late payment from last month
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd', 
        '99999999-9999-9999-9999-999999999999', 
        '11111111-1111-1111-1111-111111111111', 
        2550.00, -- Includes $50 late fee
        '2024-02-15',
        NULL,
        NULL,
        NULL,
        'late',
        'rent',
        'Includes $50 late fee',
        '2024-02-15', 
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- CREATE TEST MAINTENANCE REQUESTS
-- ============================================================================
INSERT INTO maintenance_requests (
    id,
    tenancy_id,
    organization_id,
    title,
    description,
    priority,
    status,
    category,
    reported_by,
    assigned_to,
    created_at,
    updated_at
) VALUES
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '99999999-9999-9999-9999-999999999999',
        '11111111-1111-1111-1111-111111111111',
        'Leaky Kitchen Faucet',
        'The kitchen faucet has been dripping constantly for the past 3 days. Water is pooling under the sink.',
        'medium',
        'in_progress',
        'plumbing',
        '33333333-3333-3333-3333-333333333333',
        '55555555-5555-5555-5555-555555555555',
        NOW() - INTERVAL '2 days',
        NOW()
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '99999999-9999-9999-9999-999999999999',
        '11111111-1111-1111-1111-111111111111',
        'AC Not Working',
        'Air conditioning stopped working yesterday. Room temperature is very high.',
        'high',
        'pending',
        'hvac',
        '33333333-3333-3333-3333-333333333333',
        NULL,
        NOW() - INTERVAL '1 day',
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- CREATE TEST NOTIFICATIONS
-- ============================================================================
INSERT INTO notifications (
    id,
    user_id,
    title,
    content,
    type,
    priority,
    read,
    action_url,
    metadata,
    created_at,
    updated_at
) VALUES
    -- Notification for tenant
    (
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '33333333-3333-3333-3333-333333333333',
        'Rent Payment Due Soon',
        'Your rent payment of $2,500 is due on March 1st.',
        'payment_reminder',
        'high',
        false,
        '/payments',
        jsonb_build_object('payment_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    -- Notification for landlord
    (
        'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
        '22222222-2222-2222-2222-222222222222',
        'New Maintenance Request',
        'A new high-priority maintenance request has been submitted for Sunset View Apartment 101.',
        'maintenance_update',
        'high',
        false,
        '/maintenance/ffffffff-ffff-ffff-ffff-ffffffffffff',
        jsonb_build_object('request_id', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check organization
SELECT 'Organization' as entity, COUNT(*) as count 
FROM organizations 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Check users
SELECT 'Users' as entity, COUNT(*) as count, 
       string_agg(role || ' (' || email || ')', ', ') as details
FROM users 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Check properties
SELECT 'Properties' as entity, COUNT(*) as count,
       string_agg(name || ' - ' || status, ', ') as details
FROM properties 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Check tenancies
SELECT 'Tenancies' as entity, COUNT(*) as count,
       string_agg(status || ' (Tenant: ' || tenant_id || ')', ', ') as details
FROM tenancies 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Check payments
SELECT 'Payments' as entity, COUNT(*) as count,
       string_agg(status || ' ($' || amount || ')', ', ') as details
FROM payments 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Summary
SELECT '✅ Test data created successfully! Now create auth users and run Step 3.' as message;