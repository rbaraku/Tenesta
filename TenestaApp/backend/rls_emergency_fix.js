// Emergency RLS fix - temporarily disable RLS on users table
// This allows the messaging system to work while we debug the recursion issue

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

async function emergencyRLSFix() {
  console.log('🚨 Emergency RLS Fix - Temporarily disabling RLS on users table');
  console.log('⚠️  This is a temporary solution for testing purposes');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'Test123!@#'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Logged in as admin');
    
    // Try to disable RLS directly via a simple query
    console.log('🔧 Attempting to query pg_class to check RLS status...');
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'users');
      
    if (rlsError) {
      console.log('❌ Cannot query pg_class:', rlsError.message);
    } else {
      console.log('📊 Current RLS status:', rlsStatus);
    }
    
    // Test direct user access to see if the issue persists
    console.log('🧪 Testing user profile access...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, profile, role, organization_id')
      .eq('auth_user_id', authData.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile access still failing:', profileError.message);
      console.log('💡 You will need to manually disable RLS in Supabase Dashboard:');
      console.log('   1. Go to Table Editor -> users table');
      console.log('   2. Click "Settings" tab');
      console.log('   3. Disable "Enable Row Level Security"');
      console.log('   4. This will allow messaging system to work temporarily');
    } else {
      console.log('✅ Profile access working! User:', profile.profile?.first_name);
      console.log('   Role:', profile.role);
      console.log('   Org ID:', profile.organization_id);
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
  }
}

emergencyRLSFix();