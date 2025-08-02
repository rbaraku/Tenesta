-- Create Test Messages and Notifications
-- Run this after creating the messaging-system edge function

-- ============================================================================
-- CREATE TEST MESSAGES
-- ============================================================================

-- Insert some test messages between tenant and landlord
INSERT INTO messages (
    id,
    tenancy_id,
    sender_id,
    recipient_id,
    subject,
    content,
    message_type,
    created_at
) VALUES
    -- Message from tenant to landlord
    (
        'msg-1111-1111-1111-111111111111',
        '99999999-9999-9999-9999-999999999999',
        '33333333-3333-3333-3333-333333333333', -- tenant
        '22222222-2222-2222-2222-222222222222', -- landlord
        'Maintenance Request: Kitchen Faucet',
        'Hi John, the kitchen faucet has been dripping constantly for the past 3 days. Water is pooling under the sink and I''m concerned about potential damage. Could you please arrange for a plumber to take a look? I''m available most weekdays after 5 PM. Thank you!',
        'maintenance_request',
        NOW() - INTERVAL '2 days'
    ),
    -- Response from landlord to tenant
    (
        'msg-2222-2222-2222-222222222222',
        '99999999-9999-9999-9999-999999999999',
        '22222222-2222-2222-2222-222222222222', -- landlord
        '33333333-3333-3333-3333-333333333333', -- tenant
        'Re: Maintenance Request: Kitchen Faucet',
        'Hi Jane, thank you for reporting this issue. I''ve contacted our regular plumber and they can come out tomorrow (Wednesday) between 10 AM and 12 PM. Will you be available during that time? If not, please let me know your preferred schedule and we''ll work something out.',
        'maintenance_request',
        NOW() - INTERVAL '1 day'
    ),
    -- Follow-up from tenant
    (
        'msg-3333-3333-3333-333333333333',
        '99999999-9999-9999-9999-999999999999',
        '33333333-3333-3333-3333-333333333333', -- tenant
        '22222222-2222-2222-2222-222222222222', -- landlord
        'Re: Maintenance Request: Kitchen Faucet',
        'Perfect! I''ll be working from home tomorrow, so 10 AM to 12 PM works great. Should I provide access through the main building entrance, or do you have keys? Also, is there anything specific I should prepare or move out of the way?',
        'maintenance_request',
        NOW() - INTERVAL '18 hours'
    ),
    -- Rent reminder from landlord
    (
        'msg-4444-4444-4444-444444444444',
        '99999999-9999-9999-9999-999999999999',
        '22222222-2222-2222-2222-222222222222', -- landlord
        '33333333-3333-3333-3333-333333333333', -- tenant
        'Friendly Reminder: March Rent Due Soon',
        'Hi Jane, just a friendly reminder that your March rent payment ($2,500) is due on March 1st. You can pay through the tenant portal or via bank transfer as usual. Please let me know if you have any questions or need to discuss payment arrangements. Thanks!',
        'rent_reminder',
        NOW() - INTERVAL '5 hours'
    ),
    -- General message from landlord
    (
        'msg-5555-5555-5555-555555555555',
        '99999999-9999-9999-9999-999999999999',
        '22222222-2222-2222-2222-222222222222', -- landlord
        '33333333-3333-3333-3333-333333333333', -- tenant
        'Building Maintenance Schedule',
        'Dear residents, please be advised that we will be performing routine maintenance on the building''s HVAC system this Saturday from 9 AM to 3 PM. You may experience temporary interruptions to heating/cooling during this time. We apologize for any inconvenience.',
        'general',
        NOW() - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE TEST NOTIFICATIONS
-- ============================================================================

-- Insert various types of notifications for testing
INSERT INTO notifications (
    id,
    user_id,
    title,
    content,
    type,
    priority,
    action_url,
    metadata,
    created_at
) VALUES
    -- Payment reminder for tenant
    (
        'notif-1111-1111-1111-111111111111',
        '33333333-3333-3333-3333-333333333333', -- tenant
        'Rent Payment Due in 3 Days',
        'Your rent payment of $2,500 is due on March 1st. Click here to make a payment.',
        'payment_reminder',
        'high',
        '/payments',
        jsonb_build_object(
            'amount', 2500.00,
            'due_date', '2024-03-01',
            'payment_id', 'cccccccc-cccc-cccc-cccc-cccccccccccc'
        ),
        NOW() - INTERVAL '6 hours'
    ),
    -- Maintenance update for tenant
    (
        'notif-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333', -- tenant
        'Maintenance Request Updated',
        'Your maintenance request for the kitchen faucet has been scheduled. A plumber will visit tomorrow between 10 AM and 12 PM.',
        'maintenance_update',
        'medium',
        '/maintenance/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        jsonb_build_object(
            'request_id', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            'status', 'scheduled',
            'scheduled_time', '2024-03-01T10:00:00Z'
        ),
        NOW() - INTERVAL '4 hours'
    ),
    -- New message notification for tenant
    (
        'notif-3333-3333-3333-333333333333',
        '33333333-3333-3333-3333-333333333333', -- tenant
        'New Message from John Landlord',
        'You have received a new message about building maintenance schedule.',
        'message_received',
        'medium',
        '/messages/msg-5555-5555-5555-555555555555',
        jsonb_build_object(
            'message_id', 'msg-5555-5555-5555-555555555555',
            'sender_id', '22222222-2222-2222-2222-222222222222',
            'message_type', 'general'
        ),
        NOW() - INTERVAL '3 hours'
    ),
    -- System notification for tenant
    (
        'notif-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333', -- tenant
        'Welcome to Tenesta!',
        'Thank you for joining Tenesta. Your account has been set up successfully. Explore the app to manage your tenancy, payments, and communication with your landlord.',
        'system',
        'low',
        '/dashboard',
        jsonb_build_object(
            'welcome_flow', true,
            'account_created', NOW() - INTERVAL '7 days'
        ),
        NOW() - INTERVAL '7 days'
    ),
    -- Payment confirmation for landlord
    (
        'notif-5555-5555-5555-555555555555',
        '22222222-2222-2222-2222-222222222222', -- landlord
        'Payment Received',
        'Rent payment of $2,500 has been received from Jane Tenant for February 2024.',
        'payment_received',
        'medium',
        '/payments/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        jsonb_build_object(
            'payment_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            'amount', 2500.00,
            'tenant_id', '33333333-3333-3333-3333-333333333333'
        ),
        NOW() - INTERVAL '2 days'
    ),
    -- Maintenance request notification for landlord
    (
        'notif-6666-6666-6666-666666666666',
        '22222222-2222-2222-2222-222222222222', -- landlord
        'New Maintenance Request',
        'A new high-priority maintenance request has been submitted for Sunset View Apartment 101.',
        'maintenance_update',
        'high',
        '/maintenance/ffffffff-ffff-ffff-ffff-ffffffffffff',
        jsonb_build_object(
            'request_id', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            'priority', 'high',
            'tenant_id', '33333333-3333-3333-3333-333333333333'
        ),
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check messages
SELECT 'Messages Created' as status,
       COUNT(*) as count,
       string_agg(
           (SELECT profile->>'first_name' FROM users WHERE id = sender_id) || 
           ' → ' || 
           (SELECT profile->>'first_name' FROM users WHERE id = recipient_id) || 
           ': ' || subject, 
           ', '
       ) as details
FROM messages 
WHERE tenancy_id = '99999999-9999-9999-9999-999999999999';

-- Check notifications by user
SELECT 
    'Notifications for ' || (profile->>'first_name') as status,
    COUNT(n.*) as count,
    string_agg(n.title, ', ') as notifications
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id
WHERE u.organization_id = '11111111-1111-1111-1111-111111111111'
GROUP BY u.id, u.profile
ORDER BY u.profile->>'first_name';

-- Summary
SELECT '✅ Test messages and notifications created successfully!' as message;