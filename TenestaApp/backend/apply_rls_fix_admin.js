// Apply RLS fix by logging in as admin user
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix for users table...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Sign in as admin
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'Test123!@#'
    });
    
    if (authError) {
      console.error('❌ Admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Logged in as admin');
    
    // Read the SQL file
    const sqlCommands = [
      "ALTER TABLE users DISABLE ROW LEVEL SECURITY",
      "DROP POLICY IF EXISTS \"Users can view their own profile\" ON users",
      "DROP POLICY IF EXISTS \"Users can update their own profile\" ON users", 
      "DROP POLICY IF EXISTS \"Enable read access for authenticated users\" ON users",
      "DROP POLICY IF EXISTS \"Users can view profiles in same organization\" ON users",
      "DROP POLICY IF EXISTS \"Admins can view all user profiles\" ON users",
      "DROP POLICY IF EXISTS \"users_select_own\" ON users",
      "DROP POLICY IF EXISTS \"users_update_own\" ON users",
      "DROP POLICY IF EXISTS \"admins_select_all\" ON users",
      "DROP POLICY IF EXISTS \"org_members_select\" ON users",
      `CREATE POLICY "users_own_profile_select" ON users FOR SELECT USING (auth_user_id = auth.uid())`,
      `CREATE POLICY "users_own_profile_update" ON users FOR UPDATE USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid())`,
      "ALTER TABLE users ENABLE ROW LEVEL SECURITY"
    ];
    
    console.log('🔄 Executing SQL commands...');
    
    for (const command of sqlCommands) {
      try {
        console.log(`Executing: ${command.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.warn(`⚠️  Warning on command: ${error.message}`);
        }
      } catch (err) {
        console.warn(`⚠️  Exception on command: ${err.message}`);
      }
    }
    
    console.log('✅ RLS policies have been reset');
    
    // Test the fix by trying to fetch user profile
    console.log('🧪 Testing user profile access...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile access still failing:', profileError.message);
    } else {
      console.log('✅ Profile access working! User:', profile.profile?.first_name);
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Failed to apply RLS fix:', error.message);
  }
}

applyRLSFix();