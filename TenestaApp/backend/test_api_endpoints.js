// Tenesta API Endpoints Testing Script
// Use this script to test all the created API endpoints

const SUPABASE_URL = 'https://your-project-ref.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

// Test configuration
const TEST_CONFIG = {
  tenant_email: 'tenant@test.com',
  tenant_password: 'Test123!@#',
  landlord_email: 'landlord@test.com',
  landlord_password: 'Test123!@#',
  admin_email: 'admin@test.com',
  admin_password: 'Test123!@#'
}

// Helper function to make authenticated requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const config = {
    method,
    headers
  }
  
  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, config)
    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error)
    return { status: 500, error: error.message }
  }
}

// Authentication helper
async function login(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email,
      password
    })
  })
  
  const data = await response.json()
  return data.access_token
}

// Test functions
async function testTenantDashboard() {
  console.log('\n=== Testing Tenant Dashboard ===')
  
  try {
    const token = await login(TEST_CONFIG.tenant_email, TEST_CONFIG.tenant_password)
    if (!token) {
      console.log('❌ Failed to login as tenant')
      return
    }
    
    const result = await makeRequest('tenant-dashboard', 'GET', null, token)
    
    if (result.status === 200) {
      console.log('✅ Tenant dashboard loaded successfully')
      console.log('Dashboard data keys:', Object.keys(result.data))
      
      // Check for key components
      const { user_profile, current_tenancy, payment_status, upcoming_payments } = result.data
      console.log(`- User profile: ${user_profile ? '✅' : '❌'}`)
      console.log(`- Current tenancy: ${current_tenancy ? '✅' : '❌'}`)
      console.log(`- Payment status: ${payment_status ? '✅' : '❌'}`)
      console.log(`- Upcoming payments: ${upcoming_payments.length} found`)
    } else {
      console.log('❌ Tenant dashboard failed:', result.data.error)
    }
  } catch (error) {
    console.log('❌ Error testing tenant dashboard:', error.message)
  }
}

async function testLandlordDashboard() {
  console.log('\n=== Testing Landlord Dashboard ===')
  
  try {
    const token = await login(TEST_CONFIG.landlord_email, TEST_CONFIG.landlord_password)
    if (!token) {
      console.log('❌ Failed to login as landlord')
      return
    }
    
    const result = await makeRequest('landlord-dashboard', 'GET', null, token)
    
    if (result.status === 200) {
      console.log('✅ Landlord dashboard loaded successfully')
      console.log('Dashboard data keys:', Object.keys(result.data))
      
      const { user_profile, properties, portfolio_summary, rent_collection } = result.data
      console.log(`- User profile: ${user_profile ? '✅' : '❌'}`)
      console.log(`- Properties: ${properties.length} found`)
      console.log(`- Portfolio summary: ${portfolio_summary ? '✅' : '❌'}`)
      console.log(`- Rent collection: ${rent_collection ? '✅' : '❌'}`)
      
      if (portfolio_summary) {
        console.log(`  - Total properties: ${portfolio_summary.total_properties}`)
        console.log(`  - Occupancy rate: ${portfolio_summary.occupancy_rate}%`)
        console.log(`  - Monthly rent: $${portfolio_summary.total_monthly_rent}`)
      }
    } else {
      console.log('❌ Landlord dashboard failed:', result.data.error)
    }
  } catch (error) {
    console.log('❌ Error testing landlord dashboard:', error.message)
  }
}

async function testPropertyManagement() {
  console.log('\n=== Testing Property Management ===')
  
  try {
    const token = await login(TEST_CONFIG.landlord_email, TEST_CONFIG.landlord_password)
    if (!token) {
      console.log('❌ Failed to login as landlord')
      return
    }
    
    // Test creating a property
    console.log('Testing property creation...')
    const createResult = await makeRequest('property-management', 'POST', {
      action: 'create_property',
      address: '456 Test Ave',
      city: 'Test City',
      state: 'NY',
      zip_code: '12345',
      rent_amount: 1500.00,
      security_deposit: 3000.00,
      property_details: {
        bedrooms: 2,
        bathrooms: 1,
        sqft: 900
      }
    }, token)
    
    if (createResult.status === 200) {
      console.log('✅ Property created successfully')
      const propertyId = createResult.data.property.id
      
      // Test getting the property
      console.log('Testing property retrieval...')
      const getResult = await makeRequest('property-management', 'POST', {
        action: 'get_property',
        property_id: propertyId
      }, token)
      
      if (getResult.status === 200) {
        console.log('✅ Property retrieved successfully')
      } else {
        console.log('❌ Property retrieval failed:', getResult.data.error)
      }
      
      // Test updating the property
      console.log('Testing property update...')
      const updateResult = await makeRequest('property-management', 'POST', {
        action: 'update_property',
        property_id: propertyId,
        rent_amount: 1600.00,
        status: 'available'
      }, token)
      
      if (updateResult.status === 200) {
        console.log('✅ Property updated successfully')
      } else {
        console.log('❌ Property update failed:', updateResult.data.error)
      }
      
    } else {
      console.log('❌ Property creation failed:', createResult.data.error)
    }
    
    // Test listing properties
    console.log('Testing property listing...')
    const listResult = await makeRequest('property-management', 'POST', {
      action: 'list_properties'
    }, token)
    
    if (listResult.status === 200) {
      console.log(`✅ Properties listed successfully (${listResult.data.properties.length} found)`)
    } else {
      console.log('❌ Property listing failed:', listResult.data.error)
    }
    
  } catch (error) {
    console.log('❌ Error testing property management:', error.message)
  }
}

async function testPaymentProcessing() {
  console.log('\n=== Testing Payment Processing ===')
  
  try {
    const tenantToken = await login(TEST_CONFIG.tenant_email, TEST_CONFIG.tenant_password)
    if (!tenantToken) {
      console.log('❌ Failed to login as tenant')
      return
    }
    
    // First, get a payment ID from the tenant's data
    const dashboardResult = await makeRequest('tenant-dashboard', 'GET', null, tenantToken)
    
    if (dashboardResult.status !== 200 || !dashboardResult.data.upcoming_payments.length) {
      console.log('❌ No upcoming payments found for testing')
      return
    }
    
    const paymentId = dashboardResult.data.upcoming_payments[0].id
    
    // Test getting payment status
    console.log('Testing payment status retrieval...')
    const statusResult = await makeRequest('payment-process', 'POST', {
      payment_id: paymentId,
      action: 'get_status'
    }, tenantToken)
    
    if (statusResult.status === 200) {
      console.log('✅ Payment status retrieved successfully')
      console.log(`Payment status: ${statusResult.data.payment_status}`)
    } else {
      console.log('❌ Payment status retrieval failed:', statusResult.data.error)
    }
    
    // Test creating payment intent
    console.log('Testing payment intent creation...')
    const intentResult = await makeRequest('payment-process', 'POST', {
      payment_id: paymentId,
      action: 'create_intent'
    }, tenantToken)
    
    if (intentResult.status === 200) {
      console.log('✅ Payment intent created successfully')
      console.log(`Payment intent ID: ${intentResult.data.payment_intent_id}`)
    } else {
      console.log('❌ Payment intent creation failed:', intentResult.data.error)
    }
    
  } catch (error) {
    console.log('❌ Error testing payment processing:', error.message)
  }
}

async function testDisputeManagement() {
  console.log('\n=== Testing Dispute Management ===')
  
  try {
    const tenantToken = await login(TEST_CONFIG.tenant_email, TEST_CONFIG.tenant_password)
    if (!tenantToken) {
      console.log('❌ Failed to login as tenant')
      return
    }
    
    // Get tenant's tenancy ID
    const dashboardResult = await makeRequest('tenant-dashboard', 'GET', null, tenantToken)
    
    if (dashboardResult.status !== 200 || !dashboardResult.data.current_tenancy) {
      console.log('❌ No active tenancy found for testing')
      return
    }
    
    const tenancyId = dashboardResult.data.current_tenancy.id
    
    // Test creating a dispute
    console.log('Testing dispute creation...')
    const createResult = await makeRequest('dispute-management', 'POST', {
      action: 'create',
      tenancy_id: tenancyId,
      title: 'Test Maintenance Issue',
      description: 'The heating system is not working properly',
      category: 'maintenance',
      priority: 'high'
    }, tenantToken)
    
    if (createResult.status === 200) {
      console.log('✅ Dispute created successfully')
      const disputeId = createResult.data.dispute.id
      
      // Test getting the dispute
      console.log('Testing dispute retrieval...')
      const getResult = await makeRequest('dispute-management', 'POST', {
        action: 'get',
        dispute_id: disputeId
      }, tenantToken)
      
      if (getResult.status === 200) {
        console.log('✅ Dispute retrieved successfully')
      } else {
        console.log('❌ Dispute retrieval failed:', getResult.data.error)
      }
      
      // Test listing disputes
      console.log('Testing dispute listing...')
      const listResult = await makeRequest('dispute-management', 'POST', {
        action: 'list'
      }, tenantToken)
      
      if (listResult.status === 200) {
        console.log(`✅ Disputes listed successfully (${listResult.data.disputes.length} found)`)
      } else {
        console.log('❌ Dispute listing failed:', listResult.data.error)
      }
      
    } else {
      console.log('❌ Dispute creation failed:', createResult.data.error)
    }
    
  } catch (error) {
    console.log('❌ Error testing dispute management:', error.message)
  }
}

async function testAuthenticationFlows() {
  console.log('\n=== Testing Authentication Flows ===')
  
  try {
    // Test tenant login
    console.log('Testing tenant authentication...')
    const tenantToken = await login(TEST_CONFIG.tenant_email, TEST_CONFIG.tenant_password)
    console.log(tenantToken ? '✅ Tenant login successful' : '❌ Tenant login failed')
    
    // Test landlord login  
    console.log('Testing landlord authentication...')
    const landlordToken = await login(TEST_CONFIG.landlord_email, TEST_CONFIG.landlord_password)
    console.log(landlordToken ? '✅ Landlord login successful' : '❌ Landlord login failed')
    
    // Test admin login
    console.log('Testing admin authentication...')
    const adminToken = await login(TEST_CONFIG.admin_email, TEST_CONFIG.admin_password)
    console.log(adminToken ? '✅ Admin login successful' : '❌ Admin login failed')
    
    // Test invalid credentials
    console.log('Testing invalid credentials...')
    const invalidToken = await login('invalid@test.com', 'wrongpassword')
    console.log(!invalidToken ? '✅ Invalid credentials rejected' : '❌ Invalid credentials accepted')
    
  } catch (error) {
    console.log('❌ Error testing authentication:', error.message)
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Tenesta API Tests')
  console.log('=====================================')
  
  // Update configuration with your actual Supabase details
  console.log('⚠️  Make sure to update TEST_CONFIG with your actual credentials')
  console.log('⚠️  Make sure to update SUPABASE_URL and SUPABASE_ANON_KEY')
  
  try {
    await testAuthenticationFlows()
    await testTenantDashboard()
    await testLandlordDashboard()
    await testPropertyManagement()
    await testPaymentProcessing()
    await testDisputeManagement()
    
    console.log('\n=====================================')
    console.log('🏁 All tests completed!')
    
  } catch (error) {
    console.log('💥 Critical error during testing:', error.message)
  }
}

// Usage instructions
console.log(`
🔧 Tenesta API Testing Script
=============================

Before running this script:

1. Update the configuration variables at the top:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_ANON_KEY: Your Supabase anonymous key
   - TEST_CONFIG: Test user credentials

2. Make sure you have test users created in your database:
   - tenant@test.com (role: 'tenant')
   - landlord@test.com (role: 'landlord') 
   - admin@test.com (role: 'admin')

3. Run the script:
   node test_api_endpoints.js

Or call individual test functions:
   testTenantDashboard()
   testLandlordDashboard()
   testPropertyManagement()
   testPaymentProcessing()
   testDisputeManagement()
   testAuthenticationFlows()
`)

// Uncomment to run all tests
// runAllTests()

// Export functions for individual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testTenantDashboard,
    testLandlordDashboard,
    testPropertyManagement,
    testPaymentProcessing,
    testDisputeManagement,
    testAuthenticationFlows
  }
}