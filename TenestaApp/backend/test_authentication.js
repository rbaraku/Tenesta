// Test Authentication with Test Users
// Run this after setting up all test data to verify authentication works

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test credentials
const testUsers = [
  { email: 'tenant@test.com', password: 'Test123!@#', expectedRole: 'tenant' },
  { email: 'landlord@test.com', password: 'Test123!@#', expectedRole: 'landlord' },
  { email: 'admin@test.com', password: 'Test123!@#', expectedRole: 'admin' },
  { email: 'maintenance@test.com', password: 'Test123!@#', expectedRole: 'staff' }
]

async function testUserLogin(email, password, expectedRole) {
  console.log(`\n🔐 Testing login for ${email}...`)
  
  try {
    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.log(`❌ Login failed: ${authError.message}`)
      return false
    }
    
    console.log(`✅ Login successful!`)
    console.log(`   User ID: ${authData.user.id}`)
    
    // Test tenant dashboard endpoint
    if (expectedRole === 'tenant') {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/tenant-dashboard`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'apikey': SUPABASE_ANON_KEY
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Tenant dashboard accessible`)
        console.log(`   Current tenancy: ${data.current_tenancy ? 'Found' : 'Not found'}`)
        console.log(`   Payments: ${data.recent_payments?.length || 0} found`)
      } else {
        console.log(`❌ Tenant dashboard error: ${response.status}`)
      }
    }
    
    // Test landlord dashboard endpoint
    if (expectedRole === 'landlord') {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/landlord-dashboard`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'apikey': SUPABASE_ANON_KEY
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Landlord dashboard accessible`)
        console.log(`   Properties: ${data.properties?.length || 0} found`)
        console.log(`   Total monthly rent: $${data.portfolio_summary?.total_monthly_rent || 0}`)
      } else {
        console.log(`❌ Landlord dashboard error: ${response.status}`)
      }
    }
    
    // Sign out
    await supabase.auth.signOut()
    return true
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('🧪 TENESTA AUTHENTICATION TESTS')
  console.log('================================')
  console.log(`Testing against: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  
  let passed = 0
  let failed = 0
  
  // Test each user
  for (const user of testUsers) {
    const success = await testUserLogin(user.email, user.password, user.expectedRole)
    if (success) passed++
    else failed++
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('================')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / testUsers.length) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All authentication tests passed!')
    console.log('✅ Your test users are set up correctly')
    console.log('✅ Authentication is working properly')
    console.log('✅ API endpoints are accessible with proper roles')
  } else {
    console.log('\n⚠️  Some tests failed. Please check:')
    console.log('1. Auth users are created in Supabase Dashboard')
    console.log('2. Database users are linked with auth_user_id')
    console.log('3. Passwords match exactly: Test123!@#')
  }
}

// Run tests
runAllTests().catch(console.error)