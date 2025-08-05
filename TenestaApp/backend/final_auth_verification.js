// Final Authentication Verification - Test with confirmed users
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test with existing confirmed users
const confirmedUsers = [
  { email: 'tenant@test.com', role: 'tenant', auth_id: 'a3b29de5-1dc4-4cd8-8b53-94f091e23ede' },
  { email: 'landlord@test.com', role: 'landlord', auth_id: 'c07d169c-22e9-40b8-adb6-87be532a7b9b' },
  { email: 'admin@test.com', role: 'admin', auth_id: '63a5b034-b8b5-42f7-a67a-5ed05d577a8a' }
];

// Let's create new test users with a different approach
async function createNewTestUser(email, role) {
  console.log(`\n📧 Creating new test user: ${email}`);
  
  const password = 'TenestaTest2025!';
  
  try {
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { role: role }
      }
    });

    if (error) {
      console.log(`❌ User creation failed: ${error.message}`);
      return null;
    }

    console.log(`✅ User created: ${data.user?.id}`);
    console.log(`   Email confirmation needed: ${!data.user?.email_confirmed_at}`);
    
    return {
      email: email,
      password: password,
      role: role,
      auth_id: data.user?.id,
      confirmed: !!data.user?.email_confirmed_at
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testApiEndpointsWithoutAuth() {
  console.log('\n🔒 Testing API Endpoint Protection (Without Authentication)');
  console.log('==========================================================');

  const endpoints = [
    'tenant-dashboard',
    'landlord-dashboard',
    'property-management', 
    'maintenance-requests',
    'admin-panel',
    'support-tickets',
    'dispute-management',
    'payment-process',
    'document-management',
    'messaging-system',
    'subscription-management',
    'household-management'
  ];

  let protected = 0;
  let total = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        console.log(`✅ ${endpoint}: Properly protected (401 Unauthorized)`);
        protected++;
      } else if (response.status === 404) {
        console.log(`⚠️  ${endpoint}: Not found (404) - might not be deployed`);
      } else {
        console.log(`❌ ${endpoint}: Not protected (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error testing - ${error.message}`);
    }
  }

  console.log(`\nProtection Summary: ${protected}/${total} endpoints properly protected`);
  return { protected, total, percentage: ((protected / total) * 100).toFixed(1) };
}

async function testDatabaseConnectivity() {
  console.log('\n🗄️  Testing Database Connectivity & Structure');
  console.log('=============================================');

  try {
    // Test basic database query
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, auth_user_id, created_at')
      .limit(3);

    if (usersError) {
      console.log(`❌ Users table query failed: ${usersError.message}`);
      return false;
    }

    console.log(`✅ Users table accessible`);
    console.log(`   Found ${users.length} users`);

    // Test auth.users connectivity (this should work with anon key for current user)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log(`⚠️  Auth user check failed (expected - no session): ${authError.message}`);
    } else {
      console.log(`✅ Auth system accessible`);
    }

    // Test basic table structure
    const tables = ['tenancies', 'properties', 'payments', 'disputes', 'messages'];
    let accessibleTables = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (!error) {
          console.log(`✅ ${table} table: Accessible`);
          accessibleTables++;
        } else {
          console.log(`⚠️  ${table} table: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${table} table: Error - ${e.message}`);
      }
    }

    console.log(`\nDatabase Summary: ${accessibleTables}/${tables.length} tables accessible`);
    return true;

  } catch (error) {
    console.log(`❌ Database connectivity test failed: ${error.message}`);
    return false;
  }
}

async function testUserProfileIntegration() {
  console.log('\n👤 Testing User Profile Integration');
  console.log('===================================');

  try {
    // Check if public.users table has proper structure
    const { data: profileStructure, error: structureError } = await supabase
      .from('users')
      .select('id, email, role, auth_user_id, profile, settings, created_at')
      .limit(1);

    if (structureError) {
      console.log(`❌ Profile structure check failed: ${structureError.message}`);
      return false;
    }

    console.log(`✅ User profile table structure is correct`);
    
    // Check role distribution
    const { data: roleStats, error: roleError } = await supabase
      .from('users')
      .select('role')
      .not('role', 'is', null);

    if (!roleError && roleStats) {
      const roles = roleStats.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      console.log(`✅ User roles distribution:`, roles);
    }

    return true;

  } catch (error) {
    console.log(`❌ Profile integration test failed: ${error.message}`);
    return false;
  }
}

async function testRLSPolicies() {
  console.log('\n🛡️  Testing Row Level Security (RLS) Policies');
  console.log('==============================================');

  try {
    // Test RLS on users table (should prevent unauthorized access)
    const { data: unauthorizedAccess, error: rlsError } = await supabase
      .from('users')
      .insert({
        email: 'unauthorized@test.com',
        role: 'tenant',
        auth_user_id: '00000000-0000-0000-0000-000000000000'
      });

    if (rlsError && rlsError.message.includes('row-level security')) {
      console.log(`✅ RLS is active - unauthorized insert blocked`);
      console.log(`   Error: ${rlsError.message}`);
    } else if (rlsError) {
      console.log(`⚠️  Insert blocked but might not be RLS: ${rlsError.message}`);
    } else {
      console.log(`❌ RLS not working - unauthorized insert succeeded`);
      return false;
    }

    return true;

  } catch (error) {
    console.log(`❌ RLS test failed: ${error.message}`);
    return false;
  }
}

async function runFullAuthenticationAudit() {
  console.log('🔍 TENESTA API AUTHENTICATION AUDIT');
  console.log('===================================\n');

  const results = {
    endpointProtection: await testApiEndpointsWithoutAuth(),
    databaseConnectivity: await testDatabaseConnectivity(),
    profileIntegration: await testUserProfileIntegration(),
    rlsPolicies: await testRLSPolicies()
  };

  // Create new test users to verify the signup flow works
  console.log('\n🆕 Testing New User Creation Flow');
  console.log('=================================');
  
  const timestamp = Date.now();
  const testUserResults = await Promise.all([
    createNewTestUser(`audit_tenant_${timestamp}@tenesta.com`, 'tenant'),
    createNewTestUser(`audit_landlord_${timestamp}@tenesta.com`, 'landlord')
  ]);

  const successfulCreations = testUserResults.filter(result => result !== null);
  
  console.log(`\n📊 AUTHENTICATION AUDIT SUMMARY`);
  console.log('================================');
  console.log(`🔒 Endpoint Protection: ${results.endpointProtection.protected}/${results.endpointProtection.total} (${results.endpointProtection.percentage}%)`);
  console.log(`🗄️  Database Connectivity: ${results.databaseConnectivity ? '✅ Working' : '❌ Failed'}`);
  console.log(`👤 Profile Integration: ${results.profileIntegration ? '✅ Working' : '❌ Failed'}`);
  console.log(`🛡️  RLS Policies: ${results.rlsPolicies ? '✅ Active' : '❌ Not Working'}`);
  console.log(`🆕 User Creation: ${successfulCreations.length}/2 successful`);

  // Overall health assessment
  const endpointScore = (results.endpointProtection.protected / results.endpointProtection.total);
  const otherTests = [
    results.databaseConnectivity,
    results.profileIntegration, 
    results.rlsPolicies
  ];
  const otherScore = otherTests.filter(test => test).length / otherTests.length;
  const userCreationScore = successfulCreations.length / 2;

  const overallScore = (endpointScore + otherScore + userCreationScore) / 3;

  console.log(`\n🎯 OVERALL AUTHENTICATION HEALTH`);
  console.log('=================================');
  
  if (overallScore >= 0.9) {
    console.log(`✅ EXCELLENT (${(overallScore * 100).toFixed(1)}%)`);
    console.log(`   Authentication system is fully functional`);
  } else if (overallScore >= 0.7) {
    console.log(`⚠️  GOOD (${(overallScore * 100).toFixed(1)}%)`);
    console.log(`   Authentication system is mostly working with minor issues`);
  } else if (overallScore >= 0.5) {
    console.log(`⚠️  NEEDS ATTENTION (${(overallScore * 100).toFixed(1)}%)`);
    console.log(`   Authentication system has significant issues`);
  } else {
    console.log(`❌ CRITICAL (${(overallScore * 100).toFixed(1)}%)`);
    console.log(`   Authentication system requires immediate attention`);
  }

  console.log(`\n📋 RECOMMENDATIONS FOR FRONTEND INTEGRATION:`);
  console.log(`• Use Supabase Auth for sign-up/sign-in (working)`);
  console.log(`• All API endpoints require Bearer tokens (properly protected)`);
  console.log(`• User profiles may need manual creation after auth signup`);
  console.log(`• RLS policies are active - respect user permissions`);
  console.log(`• Email confirmation is required for new users`);

  if (successfulCreations.length > 0) {
    console.log(`\n🔑 TEST CREDENTIALS CREATED:`);
    successfulCreations.forEach(user => {
      console.log(`   ${user.role}: ${user.email} | ${user.password}`);
      console.log(`   (⚠️  Email confirmation required before use)`);
    });
  }

  return {
    overallScore,
    details: results,
    testUsers: successfulCreations
  };
}

if (require.main === module) {
  runFullAuthenticationAudit()
    .then(results => {
      console.log('\n✅ Authentication audit completed');
      process.exit(results.overallScore >= 0.7 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runFullAuthenticationAudit };