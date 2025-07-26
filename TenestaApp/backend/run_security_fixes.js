// Script to apply database security fixes via Supabase client
// This will run the security function updates

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0'

// Note: This script requires a service role key to modify functions
// You would need to run the SQL directly in Supabase SQL Editor instead

console.log('🔒 DATABASE SECURITY FIXES')
console.log('=' .repeat(30))

console.log('❌ Cannot run function modifications with anon key')
console.log('📝 To apply security fixes, please:')
console.log('')
console.log('1. Go to your Supabase Dashboard')
console.log('2. Navigate to SQL Editor')
console.log('3. Copy and paste the contents of fix_function_security.sql')
console.log('4. Execute the SQL to update all functions')
console.log('')
console.log('⚠️  This will update the following functions with secure search paths:')
console.log('   - get_user_role')
console.log('   - is_property_landlord') 
console.log('   - is_property_tenant')
console.log('   - generate_next_payment')
console.log('   - generate_ticket_number')
console.log('   - notify_payment_status_change')
console.log('   - notify_dispute_status_change')
console.log('   - is_valid_email')
console.log('   - is_strong_password')
console.log('')
console.log('✅ After running the SQL, these functions will be secure')

// However, we can test if some basic functions exist
async function testDatabaseFunctions() {
  console.log('\n🔍 Testing Database Function Availability')
  console.log('=' .repeat(45))
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    // Test if we can call a basic function (this might fail due to RLS but will tell us if function exists)
    const { data, error } = await supabase.rpc('is_valid_email', { email_address: 'test@example.com' })
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ is_valid_email function not found - needs to be created')
      } else {
        console.log('⚠️  is_valid_email function exists but returned error:', error.message)
      }
    } else {
      console.log('✅ is_valid_email function working:', data)
    }
    
  } catch (err) {
    console.log('❌ Error testing functions:', err.message)
  }
  
  console.log('')
  console.log('💡 Next: Run fix_function_security.sql in Supabase SQL Editor')
}

testDatabaseFunctions()