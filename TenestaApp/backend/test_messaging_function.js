const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';

async function testMessagingFunction() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('🧪 Testing Messaging System Function Deployment');
  console.log('================================================');
  
  // Sign in as tenant
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'tenant@test.com',
    password: 'Test123!@#'
  });
  
  if (authError) {
    console.log('❌ Login failed:', authError.message);
    return;
  }
  
  console.log('✅ Logged in successfully as tenant@test.com');
  const token = authData.session.access_token;
  
  // Test messaging function
  try {
    console.log('\n📞 Calling messaging-system function...');
    const functionUrl = `${SUPABASE_URL}/functions/v1/messaging-system`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_notifications',
        limit: 5
      })
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Messaging function is deployed and working!');
      console.log(`📝 Found ${result.count || 0} notifications`);
      
      if (result.notifications && result.notifications.length > 0) {
        console.log('📋 Sample notifications:');
        result.notifications.slice(0, 3).forEach((notif, i) => {
          console.log(`   ${i + 1}. ${notif.title} (${notif.priority})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Function response error:');
      console.log('   Status:', response.status);
      console.log('   Error:', errorText);
      
      if (response.status === 404) {
        console.log('\n💡 The messaging-system function is not deployed.');
        console.log('   Please deploy it manually through the Supabase Dashboard.');
      }
    }
  } catch (error) {
    console.log('❌ Function call failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 This could mean:');
      console.log('   1. The function is not deployed');
      console.log('   2. Network connectivity issue');
      console.log('   3. Function URL is incorrect');
    }
  }
  
  await supabase.auth.signOut();
}

testMessagingFunction().catch(console.error);