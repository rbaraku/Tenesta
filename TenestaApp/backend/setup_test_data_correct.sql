-- CORRECTED Test Data Setup - Matches Actual Database Schema
-- Run this in Supabase SQL Editor with postgres role

-- ============================================================================
-- CLEAR EXISTING TEST DATA (Optional)
-- ============================================================================
-- Uncomment these lines if you want to start fresh:
/*
DELETE FROM payments WHERE tenancy_id IN (
    SELECT id FROM tenancies WHERE property_id IN (
        SELECT id FROM properties WHERE organization_id = '11111111-1111-1111-1111-111111111111'
    )
);
DELETE FROM tenancies WHERE property_id IN (
    SELECT id FROM properties WHERE organization_id = '11111111-1111-1111-1111-111111111111'
);
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
    contact_email,
    phone,
    address,
    settings,
    created_at, 
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Property Management LLC', 
    'small_business', 
    'landlord_pro',
    'admin@testpropertymanagement.com',
    '+1-555-123-4567',
    jsonb_build_object(
        'street', '100 Business Plaza',
        'city', 'San Francisco',
        'state', 'CA',
        'zip_code', '94105'
    ),
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
    settings,
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
            'avatar_url', null
        ),
        jsonb_build_object(
            'notifications', jsonb_build_object(
                'email', true,
                'push', true,
                'sms', false
            ),
            'dashboard_layout', 'grid'
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
            'avatar_url', null
        ),
        jsonb_build_object(
            'notifications', jsonb_build_object(
                'email', true,
                'push', true,
                'sms', true
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
            'phone', '+1234567892'
        ),
        jsonb_build_object(
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
            'phone', '+1234567893'
        ),
        jsonb_build_object(
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
    address,
    address_line_2,
    city, 
    state, 
    zip_code, 
    landlord_id, 
    organization_id, 
    rent_amount,
    security_deposit,
    lease_start,
    lease_end,
    bedrooms, 
    bathrooms, 
    square_feet,
    amenities,
    property_details,
    status,
    created_at, 
    updated_at
) VALUES
    -- Property 1: Modern Apartment (Currently Occupied)
    (
        '66666666-6666-6666-6666-666666666666', 
        '123 Test Street',
        'Apt 101',
        'San Francisco', 
        'CA', 
        '94105',
        '22222222-2222-2222-2222-222222222222', 
        '11111111-1111-1111-1111-111111111111', 
        2500.00,
        5000.00,
        '2024-01-01',
        '2024-12-31',
        2, 
        1, 
        850,
        ARRAY['parking', 'gym', 'pool', 'laundry_in_unit', 'balcony'],
        jsonb_build_object(
            'name', 'Sunset View Apartment 101',
            'description', 'Modern 2BR apartment with stunning city views. Recently renovated kitchen with stainless steel appliances.',
            'property_type', 'apartment',
            'building_amenities', jsonb_build_array('doorman', 'elevator', 'rooftop_deck'),
            'unit_features', jsonb_build_array('hardwood_floors', 'stainless_appliances', 'city_view'),
            'pet_policy', 'no_pets',
            'furnished', false
        ),
        'occupied',
        NOW(), 
        NOW()
    ),
    -- Property 2: Family House (Available)
    (
        '77777777-7777-7777-7777-777777777777',
        '456 Oak Avenue',
        null,
        'San Francisco',
        'CA',
        '94110',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        3500.00,
        7000.00,
        null,
        null,
        3,
        2,
        1500,
        ARRAY['garage', 'backyard', 'washer_dryer', 'dishwasher', 'central_heating'],
        jsonb_build_object(
            'name', 'Green Valley House',
            'description', 'Spacious family home with backyard and garage. Great neighborhood, close to schools.',
            'property_type', 'house',
            'lot_size', 6000,
            'garage_spaces', 2,
            'pet_policy', 'dogs_allowed',
            'furnished', false
        ),
        'available',
        NOW(),
        NOW()
    ),
    -- Property 3: Studio (Under Maintenance)
    (
        '88888888-8888-8888-8888-888888888888',
        '789 Market Street',
        'Unit 505',
        'San Francisco',
        'CA',
        '94103',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        1800.00,
        3600.00,
        null,
        null,
        0, -- Studio
        1,
        500,
        ARRAY['utilities_included', 'furnished', 'doorman', 'elevator'],
        jsonb_build_object(
            'name', 'Downtown Studio 505',
            'description', 'Cozy studio in the heart of downtown. Perfect for professionals. All utilities included.',
            'property_type', 'studio',
            'furnished', true,
            'utilities_included', true,
            'pet_policy', 'no_pets'
        ),
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
    rent_amount, 
    security_deposit,
    lease_start, 
    lease_end,
    lease_renewal_date,
    status,
    lease_terms,
    emergency_contact,
    created_at, 
    updated_at
) VALUES
    -- Active tenancy for Jane Tenant in Sunset View Apartment
    (
        '99999999-9999-9999-9999-999999999999', 
        '33333333-3333-3333-3333-333333333333', 
        '66666666-6666-6666-6666-666666666666', 
        2500.00, 
        5000.00,
        '2024-01-01', 
        '2024-12-31',
        '2024-11-01', -- Renewal date
        'active',
        jsonb_build_object(
            'pets_allowed', false,
            'max_occupants', 4,
            'parking_included', true,
            'utilities', jsonb_build_object(
                'water', 'included',
                'gas', 'tenant_pays',
                'electric', 'tenant_pays',
                'trash', 'included',
                'internet', 'tenant_pays'
            ),
            'late_fee', 50.00,
            'grace_period_days', 5,
            'rent_due_day', 1,
            'lease_type', '12_month'
        ),
        jsonb_build_object(
            'name', 'Mary Tenant',
            'phone', '+1234567899',
            'relationship', 'Mother',
            'address', '789 Parent Street, Oakland, CA 94601'
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
    amount, 
    due_date,
    paid_date,
    payment_period_start,
    payment_period_end,
    status,
    payment_method,
    stripe_payment_intent_id,
    stripe_charge_id,
    notes,
    late_fees,
    metadata,
    created_at, 
    updated_at
) VALUES
    -- January 2024 - Paid on time
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
        '99999999-9999-9999-9999-999999999999', 
        2500.00, 
        '2024-01-01',
        '2024-01-01 10:30:00',
        '2024-01-01',
        '2024-01-31',
        'paid',
        'bank_transfer',
        'pi_1234567890',
        'ch_1234567890',
        'January rent - paid on time via bank transfer',
        0.00,
        jsonb_build_object(
            'payment_source', 'tenant_portal',
            'confirmation_sent', true
        ),
        '2024-01-01', 
        '2024-01-01'
    ),
    -- February 2024 - Paid late (within grace period)
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
        '99999999-9999-9999-9999-999999999999', 
        2500.00, 
        '2024-02-01',
        '2024-02-03 14:15:00',
        '2024-02-01',
        '2024-02-29',
        'paid',
        'credit_card',
        'pi_2345678901',
        'ch_2345678901',
        'February rent - paid within grace period',
        0.00,
        jsonb_build_object(
            'payment_source', 'tenant_portal',
            'confirmation_sent', true,
            'days_late', 2
        ),
        '2024-02-01', 
        '2024-02-03'
    ),
    -- March 2024 - Currently pending
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc', 
        '99999999-9999-9999-9999-999999999999', 
        2500.00, 
        '2024-03-01',
        null,
        '2024-03-01',
        '2024-03-31',
        'pending',
        null,
        null,
        null,
        'March rent - auto-generated',
        0.00,
        jsonb_build_object(
            'auto_generated', true,
            'reminder_sent', true
        ),
        '2024-02-15', 
        '2024-02-15'
    ),
    -- April 2024 - Overdue with late fee
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd', 
        '99999999-9999-9999-9999-999999999999', 
        2550.00, -- Includes $50 late fee
        '2024-04-01',
        null,
        '2024-04-01',
        '2024-04-30',
        'late',
        null,
        null,
        null,
        'April rent - overdue, late fee applied',
        50.00,
        jsonb_build_object(
            'auto_generated', true,
            'late_fee_applied', true,
            'days_overdue', 10
        ),
        '2024-04-01', 
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check organization
SELECT 'Organization Created' as status, 
       name, subscription_tier, contact_email 
FROM organizations 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Check users
SELECT 'Users Created' as status, 
       COUNT(*) as count, 
       string_agg(role || ' (' || email || ')', ', ') as users
FROM users 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Check properties
SELECT 'Properties Created' as status,
       COUNT(*) as count,
       string_agg(
           (property_details->>'name') || ' - ' || status, 
           ', '
       ) as properties
FROM properties 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Check tenancies
SELECT 'Tenancies Created' as status,
       COUNT(*) as count,
       string_agg(status || ' ($' || rent_amount || ')', ', ') as tenancies
FROM tenancies 
WHERE property_id IN (
    SELECT id FROM properties 
    WHERE organization_id = '11111111-1111-1111-1111-111111111111'
);

-- Check payments
SELECT 'Payments Created' as status,
       COUNT(*) as count,
       string_agg(status || ' ($' || amount || ')', ', ') as payments
FROM payments 
WHERE tenancy_id IN (
    SELECT id FROM tenancies WHERE property_id IN (
        SELECT id FROM properties 
        WHERE organization_id = '11111111-1111-1111-1111-111111111111'
    )
);

-- Final success message
SELECT '✅ Test data created successfully! Proceed to Step 3 to link auth users.' as message;