// Test authentication with existing confirmed users
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test users from the database
const testUsers = [
  { email: 'tenant@test.com', role: 'tenant', expectedPassword: 'password' },
  { email: 'landlord@test.com', role: 'landlord', expectedPassword: 'password' },
  { email: 'admin@test.com', role: 'admin', expectedPassword: 'password' }
];

async function testExistingUserAuth(userInfo) {
  console.log(`\n=== Testing ${userInfo.role} authentication ===`);
  
  try {
    // Try to sign in with existing user
    console.log(`Attempting to sign in as: ${userInfo.email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userInfo.email,
      password: userInfo.expectedPassword
    });

    if (error) {
      console.log(`❌ Sign-in failed: ${error.message}`);
      return false;
    }

    console.log(`✅ Sign-in successful for ${userInfo.email}`);
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError) {
      console.log(`❌ Profile fetch failed: ${profileError.message}`);
    } else {
      console.log(`✅ Profile found: Role = ${profile.role}, Email = ${profile.email}`);
    }

    // Test accessing appropriate dashboard
    const dashboardEndpoint = userInfo.role === 'tenant' ? 'tenant-dashboard' : 
                             userInfo.role === 'landlord' ? 'landlord-dashboard' : 
                             'admin-panel';

    console.log(`Testing ${dashboardEndpoint} access...`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${dashboardEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Dashboard response status: ${response.status}`);
    
    if (response.ok) {
      const dashboardData = await response.json();
      console.log(`✅ Dashboard access successful`);
      console.log(`   Response keys: ${Object.keys(dashboardData).join(', ')}`);
    } else {
      const errorData = await response.json();
      console.log(`❌ Dashboard access failed: ${errorData.error || 'Unknown error'}`);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log(`✅ Sign-out successful`);

    return true;
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

async function testAllExistingUsers() {
  console.log('🚀 Testing Authentication with Existing Users\n');

  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    const success = await testExistingUserAuth(user);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 EXISTING USER TEST SUMMARY');
  console.log('================================');
  console.log(`Total Users Tested: ${testUsers.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testUsers.length) * 100).toFixed(1)}%`);

  return { passed, failed, total: testUsers.length };
}

// Test specific endpoint authentication
async function testEndpointAuthentication() {
  console.log('\n🔐 Testing Endpoint Authentication Requirements\n');

  const endpoints = [
    'tenant-dashboard',
    'landlord-dashboard', 
    'property-management',
    'maintenance-requests',
    'admin-panel'
  ];

  console.log('Testing unauthorized access (should all return 401)...');
  
  let correctlyProtected = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        console.log(`✅ ${endpoint}: Correctly protected (401)`);
        correctlyProtected++;
      } else {
        console.log(`❌ ${endpoint}: Not protected (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error testing - ${error.message}`);
    }
  }

  console.log(`\nProtection Summary: ${correctlyProtected}/${endpoints.length} endpoints properly protected`);
  return correctlyProtected === endpoints.length;
}

async function runAllTests() {
  const userResults = await testAllExistingUsers();
  const endpointResults = await testEndpointAuthentication();
  
  console.log('\n🎯 OVERALL AUTHENTICATION HEALTH CHECK');
  console.log('========================================');
  console.log(`User Authentication: ${userResults.passed}/${userResults.total} working`);
  console.log(`Endpoint Protection: ${endpointResults ? 'All protected' : 'Some unprotected'}`);
  
  const overallHealth = userResults.passed === userResults.total && endpointResults;
  console.log(`Overall Status: ${overallHealth ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`);
  
  return overallHealth;
}

if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllExistingUsers, testEndpointAuthentication };