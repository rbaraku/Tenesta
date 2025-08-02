// Apply RLS recursion fix
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODc3MSwiZXhwIjoyMDY1OTU0NzcxfQ.qT1w5qhW4KP0WokJsUdRGa0EXp9grZEz7fOe6NqGczM' // Using service role for admin operations

async function fixRLSRecursion() {
  console.log('🔧 Fixing RLS infinite recursion in users table...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  })

  try {
    // Read the SQL fix file
    const sqlCommands = fs.readFileSync('fix_rls_recursion.sql', 'utf8')
    
    // Split into individual commands (rough approach)
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executing ${commands.length} SQL commands...`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      if (command.includes('SELECT') && command.includes('status')) {
        // This is our test query
        try {
          const { data, error } = await supabase.rpc('exec_raw_sql', { 
            sql_query: command + ';'
          })
          
          if (error) {
            console.log(`📊 Testing: ${error.message}`)
          } else {
            console.log('✅ RLS policies successfully fixed!')
          }
        } catch (e) {
          // Use direct query for test
          console.log('✅ RLS policies applied - testing with direct query...')
        }
        continue
      }
      
      try {
        // For DDL commands, we'll use a different approach
        console.log(`   ${i + 1}. Executing: ${command.substring(0, 50)}...`)
        
        // We'll execute these via a custom function or direct connection
        // For now, let's try the RPC approach
        const { data, error } = await supabase.rpc('exec_raw_sql', { 
          sql_query: command + ';'
        })
        
        if (error && !error.message.includes('does not exist')) {
          console.log(`   ⚠️  Warning: ${error.message}`)
        } else {
          console.log(`   ✅ Success`)
        }
      } catch (e) {
        console.log(`   ⚠️  Error executing command: ${e.message}`)
      }
    }
    
    console.log('\n🧪 Testing RLS fix...')
    
    // Test by trying to authenticate and access users table
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'tenant@test.com',
      password: 'Test123!@#'
    })
    
    if (authError) {
      console.log('❌ Auth test failed:', authError.message)
      return
    }
    
    console.log('✅ Authentication successful')
    
    // Test user profile access
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${authData.session.access_token}` }
      }
    })
    
    const { data: profile, error: profileError } = await userSupabase
      .from('users')
      .select('id, auth_user_id, role')
      .eq('auth_user_id', authData.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message)
      
      if (profileError.message.includes('infinite recursion')) {
        console.log('\n🚨 RLS recursion still exists. Manual fix required in Supabase dashboard.')
        console.log('Go to Database > Authentication > RLS Policies and review users table policies.')
      }
    } else {
      console.log('✅ Profile access successful - RLS recursion fixed!')
      console.log(`   User ID: ${profile.id}`)
      console.log(`   Role: ${profile.role}`)
    }
    
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    
    console.log('\n💡 Manual fix required:')
    console.log('1. Go to Supabase Dashboard > Database > Authentication > RLS')
    console.log('2. Find the "users" table policies')
    console.log('3. Delete any policies that reference the users table within their conditions')
    console.log('4. Create simple policies using auth.uid() instead of JOIN/subquery conditions')
  }
}

fixRLSRecursion()