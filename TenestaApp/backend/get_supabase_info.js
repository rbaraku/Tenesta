// Helper script to get Supabase configuration info
// This will help you find your anon key and test basic connectivity

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'

console.log('🔍 SUPABASE PROJECT INFORMATION')
console.log('=' .repeat(40))
console.log(`Project URL: ${SUPABASE_URL}`)
console.log(`Project Ref: skjaxjaawqvjjhyxnxls`)

console.log('\n📍 WHERE TO FIND YOUR ANON KEY:')
console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard')
console.log('2. Select your Tenesta project')
console.log('3. Go to Settings → API')
console.log('4. Copy the "anon public" key (starts with "eyJ...")')

console.log('\n🔧 HOW TO TEST:')
console.log('1. Update SUPABASE_ANON_KEY in run_basic_tests.js')
console.log('2. Run: node run_basic_tests.js')

// Test basic project accessibility
async function testProjectAccess() {
  console.log('\n🌐 Testing Basic Project Access')
  console.log('=' .repeat(35))
  
  try {
    // Test if the project URL is accessible
    const response = await fetch(SUPABASE_URL, {
      method: 'HEAD'
    })
    
    console.log(`✅ Project URL accessible (Status: ${response.status})`)
    
    // Test if this looks like a Supabase project
    const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD'
    })
    
    if (restResponse.status === 401) {
      console.log('✅ REST API endpoint responding (needs auth)')
    } else {
      console.log(`⚠️  REST API status: ${restResponse.status}`)
    }
    
    // Test Edge Functions endpoint
    const functionsResponse = await fetch(`${SUPABASE_URL}/functions/v1/`, {
      method: 'HEAD'  
    })
    
    if (functionsResponse.status === 401) {
      console.log('✅ Edge Functions endpoint available (needs auth)')
    } else if (functionsResponse.status === 404) {
      console.log('⚠️  Edge Functions not deployed yet')
    } else {
      console.log(`ℹ️  Edge Functions status: ${functionsResponse.status}`)
    }
    
  } catch (error) {
    console.log(`❌ Error accessing project: ${error.message}`)
  }
}

// Test with a provided anon key
async function testWithAnonKey(anonKey) {
  console.log('\n🔑 Testing with Anon Key')
  console.log('=' .repeat(28))
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    })
    
    if (response.status === 200) {
      console.log('✅ Anon key is valid and working')
      
      // Test a simple query to see if we can access the database
      const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Accept': 'application/json'
        }
      })
      
      if (tablesResponse.ok) {
        console.log('✅ Database access working')
      } else {
        console.log(`⚠️  Database access status: ${tablesResponse.status}`)
      }
      
    } else {
      console.log(`❌ Anon key test failed (Status: ${response.status})`)
    }
    
  } catch (error) {
    console.log(`❌ Error testing anon key: ${error.message}`)
  }
}

// Main function
async function main() {
  await testProjectAccess()
  
  console.log('\n💬 NEXT STEPS:')
  console.log('1. Get your anon key from Supabase dashboard')
  console.log('2. Run: testWithAnonKey("your-anon-key-here")')
  console.log('3. Once confirmed, update run_basic_tests.js')
  console.log('4. Deploy API functions to test endpoints')
}

// Export test function
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWithAnonKey, testProjectAccess }
}

// Run main if executed directly
if (typeof window === 'undefined') {
  main().catch(console.error)
}