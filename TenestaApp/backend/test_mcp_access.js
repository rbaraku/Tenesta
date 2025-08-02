// Test if we can access the database directly to fix RLS
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

async function testDirectAccess() {
  console.log('🧪 Testing direct database access...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Test without authentication first
    console.log('📊 Checking available functions...');
    const { data: functions, error: funcError } = await supabase.rpc('test');
    console.log('Functions test result:', { functions, error: funcError });
    
    // Check if we can query information_schema directly
    console.log('📋 Checking table info...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'users');
    console.log('Tables result:', { tables, error: tableError });
    
  } catch (error) {
    console.error('❌ Direct access failed:', error.message);
  }
}

testDirectAccess();