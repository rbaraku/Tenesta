// Comprehensive Authentication API Testing for Tenesta
// Tests all authentication endpoints and validates integration with frontend

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AuthenticationTester {
  constructor() {
    this.testResults = [];
    this.testUser = null;
    this.accessToken = null;
  }

  log(test, status, message, data = null) {
    const result = {
      timestamp: new Date().toISOString(),
      test,
      status,
      message,
      data
    };
    this.testResults.push(result);
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`);
    if (data) console.log('Data:', JSON.stringify(data, null, 2));
  }

  async testSignUp() {
    console.log('\n=== Testing User Sign-Up ===');
    
    try {
      // Generate unique test email
      const testEmail = `test_${Date.now()}@tenesta.com`;
      const testPassword = 'TestPassword123!';

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            role: 'tenant',
            full_name: 'Test User'
          }
        }
      });

      if (error) {
        this.log('Sign-Up', 'FAIL', error.message, error);
        return false;
      }

      this.testUser = { email: testEmail, password: testPassword };
      this.log('Sign-Up', 'PASS', 'User created successfully', {
        user_id: data.user?.id,
        email: data.user?.email,
        confirmed: data.user?.email_confirmed_at ? true : false
      });

      return true;
    } catch (error) {
      this.log('Sign-Up', 'FAIL', error.message, error);
      return false;
    }
  }

  async testSignIn() {
    console.log('\n=== Testing User Sign-In ===');
    
    if (!this.testUser) {
      // Use existing test user if sign-up failed
      this.testUser = { email: 'tenant@test.com', password: 'password' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: this.testUser.email,
        password: this.testUser.password
      });

      if (error) {
        this.log('Sign-In', 'FAIL', error.message, error);
        return false;
      }

      this.accessToken = data.session?.access_token;
      this.log('Sign-In', 'PASS', 'User signed in successfully', {
        user_id: data.user?.id,
        email: data.user?.email,
        session_expires_at: data.session?.expires_at,
        has_access_token: !!this.accessToken
      });

      return true;
    } catch (error) {
      this.log('Sign-In', 'FAIL', error.message, error);
      return false;
    }
  }

  async testUserProfile() {
    console.log('\n=== Testing User Profile Creation ===');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        this.log('User Profile', 'FAIL', 'Could not get authenticated user', userError);
        return false;
      }

      // Check if user exists in users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        this.log('User Profile', 'FAIL', 'Error fetching user profile', profileError);
        return false;
      }

      if (!profile) {
        // Create user profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            email: user.email,
            role: 'tenant',
            auth_user_id: user.id,
            profile: { full_name: 'Test User' }
          })
          .select()
          .single();

        if (createError) {
          this.log('User Profile', 'FAIL', 'Could not create user profile', createError);
          return false;
        }

        this.log('User Profile', 'PASS', 'User profile created successfully', newProfile);
      } else {
        this.log('User Profile', 'PASS', 'User profile exists', {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          auth_user_id: profile.auth_user_id
        });
      }

      return true;
    } catch (error) {
      this.log('User Profile', 'FAIL', error.message, error);
      return false;
    }
  }

  async testRoleAssignment() {
    console.log('\n=== Testing Role Assignment ===');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        this.log('Role Assignment', 'FAIL', 'Could not get authenticated user', userError);
        return false;
      }

      // Check user role in database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, email')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        this.log('Role Assignment', 'FAIL', 'Could not fetch user role', profileError);
        return false;
      }

      // Validate role is correctly assigned
      const validRoles = ['tenant', 'landlord', 'admin'];
      if (!validRoles.includes(profile.role)) {
        this.log('Role Assignment', 'FAIL', `Invalid role: ${profile.role}`, profile);
        return false;
      }

      this.log('Role Assignment', 'PASS', `User has valid role: ${profile.role}`, {
        email: profile.email,
        role: profile.role
      });

      return true;
    } catch (error) {
      this.log('Role Assignment', 'FAIL', error.message, error);
      return false;
    }
  }

  async testProtectedEndpointAccess() {
    console.log('\n=== Testing Protected Endpoint Access ===');
    
    if (!this.accessToken) {
      this.log('Protected Endpoint', 'FAIL', 'No access token available');
      return false;
    }

    try {
      // Test tenant dashboard endpoint
      const response = await fetch('https://skjaxjaawqvjjhyxnxls.supabase.co/functions/v1/tenant-dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.log('Protected Endpoint', 'FAIL', 'Unauthorized access', { status: response.status, data });
        } else if (response.status === 403) {
          this.log('Protected Endpoint', 'PASS', 'Correct role-based access control', { status: response.status, message: 'Access denied for non-tenant' });
        } else {
          this.log('Protected Endpoint', 'FAIL', 'Unexpected error', { status: response.status, data });
        }
        return response.status === 403; // 403 is expected for non-tenant users
      }

      this.log('Protected Endpoint', 'PASS', 'Successfully accessed protected endpoint', {
        status: response.status,
        has_user_profile: !!data.user_profile,
        has_tenancy: !!data.current_tenancy
      });

      return true;
    } catch (error) {
      this.log('Protected Endpoint', 'FAIL', error.message, error);
      return false;
    }
  }

  async testSessionManagement() {
    console.log('\n=== Testing Session Management ===');
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        this.log('Session Management', 'FAIL', 'Could not get session', sessionError);
        return false;
      }

      if (!session) {
        this.log('Session Management', 'FAIL', 'No active session found');
        return false;
      }

      this.log('Session Management', 'PASS', 'Active session found', {
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        has_access_token: !!session.access_token,
        has_refresh_token: !!session.refresh_token
      });

      // Test token refresh
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        this.log('Token Refresh', 'FAIL', 'Could not refresh session', refreshError);
        return false;
      }

      this.log('Token Refresh', 'PASS', 'Session refreshed successfully', {
        new_expires_at: refreshData.session?.expires_at,
        token_changed: refreshData.session?.access_token !== session.access_token
      });

      return true;
    } catch (error) {
      this.log('Session Management', 'FAIL', error.message, error);
      return false;
    }
  }

  async testErrorHandling() {
    console.log('\n=== Testing Error Handling ===');
    
    try {
      // Test invalid credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      });

      if (error) {
        this.log('Invalid Credentials', 'PASS', 'Correctly handled invalid credentials', {
          error_message: error.message,
          error_status: error.status
        });
      } else {
        this.log('Invalid Credentials', 'FAIL', 'Should have failed with invalid credentials', data);
        return false;
      }

      // Test protected endpoint without token
      const response = await fetch('https://skjaxjaawqvjjhyxnxls.supabase.co/functions/v1/tenant-dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.log('Unauthorized Access', 'PASS', 'Correctly rejected unauthorized request', {
          status: response.status
        });
      } else {
        this.log('Unauthorized Access', 'FAIL', 'Should have returned 401', {
          status: response.status
        });
        return false;
      }

      return true;
    } catch (error) {
      this.log('Error Handling', 'FAIL', error.message, error);
      return false;
    }
  }

  async testSignOut() {
    console.log('\n=== Testing User Sign-Out ===');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.log('Sign-Out', 'FAIL', error.message, error);
        return false;
      }

      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        this.log('Sign-Out', 'FAIL', 'Session still exists after sign-out', session);
        return false;
      }

      this.log('Sign-Out', 'PASS', 'User signed out successfully');
      return true;
    } catch (error) {
      this.log('Sign-Out', 'FAIL', error.message, error);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Authentication API Tests\n');
    
    const tests = [
      { name: 'Sign-Up', method: this.testSignUp },
      { name: 'Sign-In', method: this.testSignIn },
      { name: 'User Profile', method: this.testUserProfile },
      { name: 'Role Assignment', method: this.testRoleAssignment },
      { name: 'Protected Endpoint Access', method: this.testProtectedEndpointAccess },
      { name: 'Session Management', method: this.testSessionManagement },
      { name: 'Error Handling', method: this.testErrorHandling },
      { name: 'Sign-Out', method: this.testSignOut }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.method.call(this);
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Test ${test.name} threw an error:`, error);
        failed++;
      }
    }

    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

    return {
      summary: {
        total: tests.length,
        passed,
        failed,
        successRate: ((passed / tests.length) * 100).toFixed(1)
      },
      results: this.testResults
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AuthenticationTester();
  tester.runAllTests()
    .then(results => {
      console.log('\n✅ Authentication testing completed');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = AuthenticationTester;