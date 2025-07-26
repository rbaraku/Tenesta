// Tenesta Basic API Tests
// Quick validation of endpoint availability and basic functionality

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
// You'll need to update this with your actual anon key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0'

// Test results tracking
let testCount = 0
let passCount = 0
let failCount = 0

function logResult(testName, passed, message = '') {
  testCount++
  if (passed) {
    passCount++
    console.log(`✅ ${testName}`)
  } else {
    failCount++
    console.log(`❌ ${testName}`)
  }
  if (message) {
    console.log(`   ${message}`)
  }
}

// Test endpoint availability (CORS preflight)
async function testEndpointAvailability() {
  console.log('\n🌐 Testing API Endpoint Availability')
  console.log('=' .repeat(40))
  
  const endpoints = [
    'tenant-dashboard',
    'landlord-dashboard', 
    'property-management',
    'maintenance-requests',
    'household-management',
    'support-tickets',
    'dispute-management',
    'payment-process'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'OPTIONS',
        headers: {
          'apikey': SUPABASE_ANON_KEY
        }
      })
      
      const isAvailable = response.status === 200
      logResult(`${endpoint} endpoint`, isAvailable, 
        isAvailable ? 'Deployed and responding' : `Status: ${response.status}`
      )
    } catch (error) {
      logResult(`${endpoint} endpoint`, false, `Error: ${error.message}`)
    }
  }
}

// Test basic API structure (without auth)
async function testAPIStructure() {
  console.log('\n🔧 Testing API Structure')
  console.log('=' .repeat(30))
  
  try {
    // Test tenant dashboard without auth (should return 401)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tenant-dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      }
    })
    
    const isUnauthorized = response.status === 401
    logResult('Auth Protection', isUnauthorized, 
      isUnauthorized ? 'Correctly requires authentication' : `Unexpected status: ${response.status}`
    )
    
    // Test property management with invalid action
    const propResponse = await fetch(`${SUPABASE_URL}/functions/v1/property-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'invalid_action' })
    })
    
    const isAuthError = propResponse.status === 401
    logResult('Property Management Structure', isAuthError,
      isAuthError ? 'Requires authentication as expected' : `Status: ${propResponse.status}`
    )
    
  } catch (error) {
    logResult('API Structure Test', false, error.message)
  }
}

// Test CORS headers
async function testCORS() {
  console.log('\n🌍 Testing CORS Configuration')
  console.log('=' .repeat(32))
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tenant-dashboard`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'apikey': SUPABASE_ANON_KEY
      }
    })
    
    const hasCORS = response.headers.get('Access-Control-Allow-Origin') !== null
    logResult('CORS Headers', hasCORS,
      hasCORS ? 'CORS properly configured' : 'CORS headers missing'
    )
    
  } catch (error) {
    logResult('CORS Test', false, error.message)
  }
}

// Test database connectivity (indirect)
async function testDatabaseConnectivity() {
  console.log('\n🗄️ Testing Database Connectivity')
  console.log('=' .repeat(36))
  
  try {
    // Test auth endpoint to verify database connection
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'nonexistent@test.com',
        password: 'invalid'
      })
    })
    
    // We expect a 400 (bad request) for invalid credentials, not a 500 (server error)
    const isConnected = response.status === 400 || response.status === 422
    logResult('Database Connection', isConnected,
      isConnected ? 'Database responding to auth requests' : `Unexpected status: ${response.status}`
    )
    
  } catch (error) {
    logResult('Database Connection', false, error.message)
  }
}

// Test if our shared CORS file is working
async function testSharedComponents() {
  console.log('\n🔄 Testing Shared Components')
  console.log('=' .repeat(33))
  
  try {
    // Test if multiple endpoints use the same CORS headers (indicating shared components work)
    const endpoints = ['tenant-dashboard', 'landlord-dashboard']
    const corsHeaders = []
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
          method: 'OPTIONS',
          headers: { 'apikey': SUPABASE_ANON_KEY }
        })
        corsHeaders.push(response.headers.get('Access-Control-Allow-Origin'))
      } catch (e) {
        corsHeaders.push(null)
      }
    }
    
    const sharedCORS = corsHeaders.every(header => header === corsHeaders[0] && header !== null)
    logResult('Shared CORS Configuration', sharedCORS,
      sharedCORS ? 'Consistent CORS across endpoints' : 'Inconsistent or missing CORS'
    )
    
  } catch (error) {
    logResult('Shared Components', false, error.message)
  }
}

// Test Supabase project configuration
async function testSupabaseConfig() {
  console.log('\n⚙️ Testing Supabase Configuration')
  console.log('=' .repeat(38))
  
  try {
    // Test if the anon key is valid
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    const isValidKey = response.status !== 401
    logResult('Anon Key Valid', isValidKey,
      isValidKey ? 'Supabase anon key is valid' : 'Invalid or missing anon key'
    )
    
    // Test if Edge Functions are enabled
    const functionsResponse = await fetch(`${SUPABASE_URL}/functions/v1/`, {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    })
    
    const functionsEnabled = functionsResponse.status !== 404
    logResult('Edge Functions Enabled', functionsEnabled,
      functionsEnabled ? 'Edge Functions are available' : 'Edge Functions not enabled or accessible'
    )
    
  } catch (error) {
    logResult('Supabase Configuration', false, error.message)
  }
}

// Main test runner
async function runBasicTests() {
  console.log('🧪 TENESTA BASIC API TESTS')
  console.log('=' .repeat(50))
  console.log(`Testing against: ${SUPABASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  
  // Configuration check
  if (SUPABASE_ANON_KEY === 'your-anon-key-here') {
    console.log('\n⚠️  WARNING: Update SUPABASE_ANON_KEY with your actual key')
    console.log('Some tests may fail without the correct key.\n')
  }
  
  // Run test suites
  await testSupabaseConfig()
  await testEndpointAvailability()
  await testAPIStructure()
  await testCORS()
  await testDatabaseConnectivity()
  await testSharedComponents()
  
  // Print summary
  console.log('\n📊 TEST SUMMARY')
  console.log('=' .repeat(20))
  console.log(`Total Tests: ${testCount}`)
  console.log(`✅ Passed: ${passCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📈 Success Rate: ${Math.round((passCount / testCount) * 100)}%`)
  
  // Recommendations
  console.log('\n💡 NEXT STEPS:')
  if (failCount === 0) {
    console.log('🎉 All basic tests passed! Ready for:')
    console.log('1. Deploy API functions to Supabase')
    console.log('2. Run security fixes on database')
    console.log('3. Create test users and data')
    console.log('4. Run full API validation suite')
  } else {
    console.log('🔧 Issues found. Recommended actions:')
    if (SUPABASE_ANON_KEY === 'your-anon-key-here') {
      console.log('1. Update SUPABASE_ANON_KEY in this script')
    }
    console.log('2. Ensure Supabase project is properly configured')
    console.log('3. Deploy API functions using Supabase CLI')
    console.log('4. Check Supabase project settings and permissions')
  }
  
  return {
    total: testCount,
    passed: passCount,
    failed: failCount,
    successRate: Math.round((passCount / testCount) * 100)
  }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runBasicTests }
}

// Auto-run if executed directly
if (typeof window === 'undefined') {
  runBasicTests().catch(console.error)
}