// Create test users with known passwords for authentication testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testUsers = [
  {
    email: 'api_test_tenant@tenesta.com',
    password: 'TestPassword123!',
    role: 'tenant',
    profile: { full_name: 'API Test Tenant', phone: '+1234567890' }
  },
  {
    email: 'api_test_landlord@tenesta.com', 
    password: 'TestPassword123!',
    role: 'landlord',
    profile: { full_name: 'API Test Landlord', phone: '+1234567891' }
  }
];

async function createTestUser(userInfo) {
  console.log(`\n📝 Creating test user: ${userInfo.email}`);
  
  try {
    // Check if user already exists by trying to sign in
    const { data: testSignIn, error: testError } = await supabase.auth.signInWithPassword({
      email: userInfo.email,
      password: userInfo.password
    });
    
    if (testSignIn?.user) {
      console.log(`   User already exists and can sign in`);
      await supabase.auth.signOut();
      return testSignIn.user.id;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userInfo.email,
      password: userInfo.password,
      options: {
        data: {
          role: userInfo.role,
          ...userInfo.profile
        }
      }
    });

    if (authError) {
      console.log(`❌ Auth user creation failed: ${authError.message}`);
      return null;
    }

    const userId = authData.user?.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Sign in to get session (this will auto-confirm for testing)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userInfo.email,
      password: userInfo.password
    });

    if (signInError && signInError.code !== 'email_not_confirmed') {
      console.log(`❌ Sign-in test failed: ${signInError.message}`);
    } else if (signInData.user) {
      console.log(`✅ User can sign in successfully`);
      
      // Sign out after test
      await supabase.auth.signOut();
    }

    // Check if user profile exists in public.users
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('auth_user_id', userId)
      .single();

    if (existingProfile) {
      console.log(`✅ User profile exists in public.users`);
      return userId;
    }

    // Create profile in public.users table if it doesn't exist
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        email: userInfo.email,
        role: userInfo.role,
        auth_user_id: userId,
        profile: userInfo.profile
      })
      .select()
      .single();

    if (profileError) {
      console.log(`❌ Profile creation failed: ${profileError.message}`);
      return userId; // Return auth user ID even if profile creation fails
    }

    console.log(`✅ User profile created in public.users`);
    return userId;

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    return null;
  }
}

async function createAllTestUsers() {
  console.log('🚀 Creating Test Users for Authentication Testing');
  
  const createdUsers = [];
  
  for (const userInfo of testUsers) {
    const userId = await createTestUser(userInfo);
    if (userId) {
      createdUsers.push({
        ...userInfo,
        auth_user_id: userId,
        password: userInfo.password // Keep for testing
      });
    }
  }

  console.log(`\n📊 CREATION SUMMARY`);
  console.log(`===================`);
  console.log(`Total Users: ${testUsers.length}`);
  console.log(`Successfully Created: ${createdUsers.length}`);
  
  if (createdUsers.length > 0) {
    console.log(`\n📋 Test User Credentials:`);
    createdUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.email} | ${user.password}`);
    });
  }

  return createdUsers;
}

if (require.main === module) {
  createAllTestUsers()
    .then(users => {
      if (users.length === testUsers.length) {
        console.log('\n✅ All test users created successfully');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some test users failed to create');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test user creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createAllTestUsers, testUsers };