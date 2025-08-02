// Setup test messaging data
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0'

async function setupTestData() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  })

  console.log('🔧 Setting up test messaging data...')

  try {
    // Insert test messages
    const messages = [
      {
        id: 'msg-1111-1111-1111-111111111111',
        tenancy_id: '99999999-9999-9999-9999-999999999999',
        sender_id: '33333333-3333-3333-3333-333333333333', // tenant
        recipient_id: '22222222-2222-2222-2222-222222222222', // landlord
        subject: 'Maintenance Request: Kitchen Faucet',
        content: 'Hi John, the kitchen faucet has been dripping constantly for the past 3 days. Water is pooling under the sink and I\'m concerned about potential damage. Could you please arrange for a plumber to take a look? I\'m available most weekdays after 5 PM. Thank you!',
        message_type: 'maintenance_request',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-2222-2222-2222-222222222222',
        tenancy_id: '99999999-9999-9999-9999-999999999999',
        sender_id: '22222222-2222-2222-2222-222222222222', // landlord
        recipient_id: '33333333-3333-3333-3333-333333333333', // tenant
        subject: 'Re: Maintenance Request: Kitchen Faucet',
        content: 'Hi Jane, thank you for reporting this issue. I\'ve contacted our regular plumber and they can come out tomorrow (Wednesday) between 10 AM and 12 PM. Will you be available during that time? If not, please let me know your preferred schedule and we\'ll work something out.',
        message_type: 'maintenance_request',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-3333-3333-3333-333333333333',
        tenancy_id: '99999999-9999-9999-9999-999999999999',
        sender_id: '33333333-3333-3333-3333-333333333333', // tenant
        recipient_id: '22222222-2222-2222-2222-222222222222', // landlord
        subject: 'Re: Maintenance Request: Kitchen Faucet',
        content: 'Perfect! I\'ll be working from home tomorrow, so 10 AM to 12 PM works great. Should I provide access through the main building entrance, or do you have keys? Also, is there anything specific I should prepare or move out of the way?',
        message_type: 'maintenance_request',
        created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-4444-4444-4444-444444444444',
        tenancy_id: '99999999-9999-9999-9999-999999999999',
        sender_id: '22222222-2222-2222-2222-222222222222', // landlord
        recipient_id: '33333333-3333-3333-3333-333333333333', // tenant
        subject: 'Friendly Reminder: March Rent Due Soon',
        content: 'Hi Jane, just a friendly reminder that your March rent payment ($2,500) is due on March 1st. You can pay through the tenant portal or via bank transfer as usual. Please let me know if you have any questions or need to discuss payment arrangements. Thanks!',
        message_type: 'rent_reminder',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-5555-5555-5555-555555555555',
        tenancy_id: '99999999-9999-9999-9999-999999999999',
        sender_id: '22222222-2222-2222-2222-222222222222', // landlord
        recipient_id: '33333333-3333-3333-3333-333333333333', // tenant
        subject: 'Building Maintenance Schedule',
        content: 'Dear residents, please be advised that we will be performing routine maintenance on the building\'s HVAC system this Saturday from 9 AM to 3 PM. You may experience temporary interruptions to heating/cooling during this time. We apologize for any inconvenience.',
        message_type: 'general',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .upsert(messages)

    if (messagesError) {
      console.error('❌ Failed to insert messages:', messagesError)
    } else {
      console.log(`✅ Inserted ${messages.length} test messages`)
    }

    // Insert test notifications
    const notifications = [
      {
        id: 'notif-1111-1111-1111-111111111111',
        user_id: '33333333-3333-3333-3333-333333333333', // tenant
        title: 'Rent Payment Due in 3 Days',
        content: 'Your rent payment of $2,500 is due on March 1st. Click here to make a payment.',
        type: 'payment_reminder',
        priority: 'high',
        action_url: '/payments',
        metadata: {
          amount: 2500.00,
          due_date: '2024-03-01',
          payment_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc'
        },
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-2222-2222-2222-222222222222',
        user_id: '33333333-3333-3333-3333-333333333333', // tenant
        title: 'Maintenance Request Updated',
        content: 'Your maintenance request for the kitchen faucet has been scheduled. A plumber will visit tomorrow between 10 AM and 12 PM.',
        type: 'maintenance_update',
        priority: 'medium',
        action_url: '/maintenance/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        metadata: {
          request_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          status: 'scheduled',
          scheduled_time: '2024-03-01T10:00:00Z'
        },
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-3333-3333-3333-333333333333',
        user_id: '33333333-3333-3333-3333-333333333333', // tenant
        title: 'New Message from John Landlord',
        content: 'You have received a new message about building maintenance schedule.',
        type: 'message_received',
        priority: 'medium',
        action_url: '/messages/msg-5555-5555-5555-555555555555',
        metadata: {
          message_id: 'msg-5555-5555-5555-555555555555',
          sender_id: '22222222-2222-2222-2222-222222222222',
          message_type: 'general'
        },
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-4444-4444-4444-444444444444',
        user_id: '33333333-3333-3333-3333-333333333333', // tenant
        title: 'Welcome to Tenesta!',
        content: 'Thank you for joining Tenesta. Your account has been set up successfully. Explore the app to manage your tenancy, payments, and communication with your landlord.',
        type: 'system',
        priority: 'low',
        action_url: '/dashboard',
        metadata: {
          welcome_flow: true,
          account_created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-5555-5555-5555-555555555555',
        user_id: '22222222-2222-2222-2222-222222222222', // landlord
        title: 'Payment Received',
        content: 'Rent payment of $2,500 has been received from Jane Tenant for February 2024.',
        type: 'payment_received',
        priority: 'medium',
        action_url: '/payments/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        metadata: {
          payment_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          amount: 2500.00,
          tenant_id: '33333333-3333-3333-3333-333333333333'
        },
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-6666-6666-6666-666666666666',
        user_id: '22222222-2222-2222-2222-222222222222', // landlord
        title: 'New Maintenance Request',
        content: 'A new high-priority maintenance request has been submitted for Sunset View Apartment 101.',
        type: 'maintenance_update',
        priority: 'high',
        action_url: '/maintenance/ffffffff-ffff-ffff-ffff-ffffffffffff',
        metadata: {
          request_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          priority: 'high',
          tenant_id: '33333333-3333-3333-3333-333333333333'
        },
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .upsert(notifications)

    if (notificationsError) {
      console.error('❌ Failed to insert notifications:', notificationsError)
    } else {
      console.log(`✅ Inserted ${notifications.length} test notifications`)
    }

    // Verify the data
    console.log('\n🔍 Verifying test data...')
    
    const { data: messageCount, error: msgCountError } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('tenancy_id', '99999999-9999-9999-9999-999999999999')
    
    if (!msgCountError) {
      console.log(`✅ Total messages in test tenancy: ${messageCount.length}`)
    }

    const { data: notifCount, error: notifCountError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .in('user_id', ['33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'])
    
    if (!notifCountError) {
      console.log(`✅ Total notifications for test users: ${notifCount.length}`)
    }

    console.log('\n🎉 Test messaging data setup complete!')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupTestData()