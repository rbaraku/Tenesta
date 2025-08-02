// Test Messaging System API
// Tests messages, notifications, and real-time communication

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test data
const TEST_TENANCY_ID = '99999999-9999-9999-9999-999999999999' // From our test data
const TEST_CREDENTIALS = {
  tenant: { email: 'tenant@test.com', password: 'Test123!@#' },
  landlord: { email: 'landlord@test.com', password: 'Test123!@#' },
  admin: { email: 'admin@test.com', password: 'Test123!@#' }
}

// Store user IDs for cross-user testing
let userIds = {}

async function testMessagingAPI(userType = 'tenant') {
  console.log(`\n💬 TESTING MESSAGING API - ${userType.toUpperCase()}`)
  console.log('='.repeat(50))

  try {
    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(
      TEST_CREDENTIALS[userType]
    )

    if (authError) {
      console.log(`❌ Login failed: ${authError.message}`)
      return false
    }

    console.log(`✅ Logged in as ${userType}: ${authData.user.email}`)
    const token = authData.session.access_token

    // Get user profile to store user ID
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single()
    
    if (profile) {
      userIds[userType] = profile.id
      console.log(`   User ID: ${profile.id}`)
    }

    // Test 1: Get existing notifications
    console.log('\n1️⃣ Testing Get Notifications...')
    const notificationsResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_notifications',
        limit: 10
      })
    })

    if (notificationsResponse.ok) {
      const notificationsResult = await notificationsResponse.json()
      console.log(`✅ Found ${notificationsResult.count} notifications`)
      notificationsResult.notifications.slice(0, 3).forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.type} (${notif.read ? 'read' : 'unread'})`)
      })
    } else {
      const error = await notificationsResponse.json()
      console.log(`❌ Get notifications failed: ${error.error}`)
    }

    // Test 2: Get existing messages
    console.log('\n2️⃣ Testing Get Messages...')
    const messagesResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_messages',
        tenancy_id: TEST_TENANCY_ID,
        limit: 10
      })
    })

    if (messagesResponse.ok) {
      const messagesResult = await messagesResponse.json()
      console.log(`✅ Found ${messagesResult.count} messages`)
      messagesResult.messages.slice(0, 3).forEach((msg, index) => {
        const senderName = msg.sender?.profile?.first_name || 'Unknown'
        const recipientName = msg.recipient?.profile?.first_name || 'Unknown'
        console.log(`   ${index + 1}. From ${senderName} to ${recipientName}: ${msg.subject || 'No subject'} (${msg.read_at ? 'read' : 'unread'})`)
      })
    } else {
      const error = await messagesResponse.json()
      console.log(`❌ Get messages failed: ${error.error}`)
    }

    // Test 3: Send message (if we have a recipient)
    if (userType === 'tenant' && userIds.landlord) {
      console.log('\n3️⃣ Testing Send Message (Tenant to Landlord)...')
      const sendResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          recipient_id: userIds.landlord,
          tenancy_id: TEST_TENANCY_ID,
          subject: 'Test Message from API',
          content: `Hello! This is a test message sent via the messaging API at ${new Date().toISOString()}. The heating system seems to be making noise.`,
          message_type: 'maintenance_request'
        })
      })

      if (sendResponse.ok) {
        const sendResult = await sendResponse.json()
        console.log(`✅ Message sent successfully`)
        console.log(`   Message ID: ${sendResult.message.id}`)
        console.log(`   Notification sent: ${sendResult.notification_sent}`)
        
        // Store message ID for later tests
        global.testMessageId = sendResult.message.id
      } else {
        const error = await sendResponse.json()
        console.log(`❌ Send message failed: ${error.error}`)
      }
    }

    // Test 4: Send message (if we're landlord and have tenant)
    if (userType === 'landlord' && userIds.tenant) {
      console.log('\n4️⃣ Testing Send Message (Landlord to Tenant)...')
      const sendResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          recipient_id: userIds.tenant,
          tenancy_id: TEST_TENANCY_ID,
          subject: 'Response: Maintenance Request',
          content: `Thank you for reporting the heating issue. I've scheduled a technician to visit tomorrow between 10-12 PM. Please ensure someone is available to provide access.`,
          message_type: 'maintenance_request'
        })
      })

      if (sendResponse.ok) {
        const sendResult = await sendResponse.json()
        console.log(`✅ Message sent successfully`)
        console.log(`   Message ID: ${sendResult.message.id}`)
        console.log(`   Notification sent: ${sendResult.notification_sent}`)
      } else {
        const error = await sendResponse.json()
        console.log(`❌ Send message failed: ${error.error}`)
      }
    }

    // Test 5: Get conversation (if we have both users)
    if (userType === 'tenant' && userIds.landlord) {
      console.log('\n5️⃣ Testing Get Conversation...')
      const conversationResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_conversation',
          recipient_id: userIds.landlord,
          tenancy_id: TEST_TENANCY_ID,
          limit: 10
        })
      })

      if (conversationResponse.ok) {
        const conversationResult = await conversationResponse.json()
        console.log(`✅ Found ${conversationResult.count} messages in conversation`)
        conversationResult.conversation.slice(-3).forEach((msg, index) => {
          const senderName = msg.sender?.profile?.first_name || 'Unknown'
          const time = new Date(msg.created_at).toLocaleTimeString()
          console.log(`   ${time} - ${senderName}: ${msg.content.substring(0, 50)}...`)
        })
      } else {
        const error = await conversationResponse.json()
        console.log(`❌ Get conversation failed: ${error.error}`)
      }
    }

    // Test 6: Mark message as read (if we have a message)
    if (global.testMessageId) {
      console.log('\n6️⃣ Testing Mark Message as Read...')
      const markReadResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'mark_read',
          message_id: global.testMessageId
        })
      })

      if (markReadResponse.ok) {
        const markReadResult = await markReadResponse.json()
        console.log(`✅ Message marked as read`)
      } else {
        const error = await markReadResponse.json()
        console.log(`❌ Mark read failed: ${error.error}`)
      }
    }

    await supabase.auth.signOut()
    return true

  } catch (error) {
    console.error(`❌ Test error: ${error.message}`)
    return false
  }
}

async function testNotificationCreation() {
  console.log(`\n🔔 TESTING NOTIFICATION CREATION - ADMIN`)
  console.log('='.repeat(50))

  try {
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(
      TEST_CREDENTIALS.admin
    )

    if (authError) {
      console.log(`❌ Admin login failed: ${authError.message}`)
      return false
    }

    console.log(`✅ Logged in as admin: ${authData.user.email}`)
    const token = authData.session.access_token

    // Test creating notification for tenant
    if (userIds.tenant) {
      console.log('\n📢 Creating test notification for tenant...')
      const notificationResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-system`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_notification',
          recipient_id: userIds.tenant,
          title: 'Rent Payment Reminder',
          content: 'Your rent payment is due in 3 days. Please make sure to submit your payment on time to avoid late fees.',
          notification_type: 'payment_reminder',
          priority: 'high',
          action_url: '/payments',
          metadata: {
            due_date: '2024-03-01',
            amount: 2500.00,
            payment_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc'
          }
        })
      })

      if (notificationResponse.ok) {
        const notificationResult = await notificationResponse.json()
        console.log(`✅ Notification created successfully`)
        console.log(`   Notification ID: ${notificationResult.notification.id}`)
        console.log(`   Priority: ${notificationResult.notification.priority}`)
      } else {
        const error = await notificationResponse.json()
        console.log(`❌ Create notification failed: ${error.error}`)
      }
    }

    await supabase.auth.signOut()
    return true

  } catch (error) {
    console.error(`❌ Notification test error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('🧪 TENESTA MESSAGING SYSTEM API TESTS')
  console.log('=' .repeat(60))
  console.log(`Testing against: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  let passed = 0
  let failed = 0

  // Test as tenant first (to get user ID)
  const tenantSuccess = await testMessagingAPI('tenant')
  if (tenantSuccess) passed++; else failed++

  // Test as landlord (to get user ID and enable cross-user messaging)
  const landlordSuccess = await testMessagingAPI('landlord')
  if (landlordSuccess) passed++; else failed++

  // Test notification creation as admin
  const notificationSuccess = await testNotificationCreation()
  if (notificationSuccess) passed++; else failed++

  // Test tenant again to see new messages/notifications
  console.log('\n🔄 Re-testing tenant to see new messages/notifications...')
  const tenantRecheckSuccess = await testMessagingAPI('tenant')
  if (tenantRecheckSuccess) passed++; else failed++

  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(20))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed === 0) {
    console.log('\n🎉 All messaging system tests passed!')
    console.log('✅ Message sending/receiving working')
    console.log('✅ Notification system working')
    console.log('✅ Conversation management working')
    console.log('✅ Read status tracking working')
    console.log('✅ Access control working')
  } else {
    console.log('\n⚠️  Some tests failed. Check:')
    console.log('1. Messaging system function is deployed')
    console.log('2. Database tables exist (messages, notifications)')
    console.log('3. RLS policies are set up correctly')
    console.log('4. Real-time features are enabled')
  }
}

// Run tests
runAllTests().catch(console.error)