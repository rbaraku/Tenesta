const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'skjaxjaawqvjjhyxnxls';
const ACCESS_TOKEN = 'sbp_8b2520e8c32cc27851aa93cdb982dee4c17ff2fb';

const functions = [
  'tenant-dashboard',
  'landlord-dashboard',
  'property-management',
  'maintenance-requests',
  'household-management',
  'support-tickets',
  'dispute-management',
  'payment-process',
  'messaging-system',
  'document-management',
  'admin-panel'
];

async function deployFunction(functionName) {
  console.log(`\n📦 Deploying ${functionName}...`);
  
  try {
    // Read the function code
    const functionPath = path.join(__dirname, 'supabase', 'functions', functionName, 'index.ts');
    
    if (!fs.existsSync(functionPath)) {
      console.log(`⚠️  Function file not found: ${functionPath}`);
      return false;
    }
    
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    // Read shared CORS file
    const corsPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'cors.ts');
    const corsCode = fs.existsSync(corsPath) ? fs.readFileSync(corsPath, 'utf8') : '';
    
    // Deploy using Supabase Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${functionName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: functionName,
        entrypoint: 'index.ts',
        import_map: {
          imports: {
            './_shared/cors.ts': './cors.ts'
          }
        },
        files: {
          'index.ts': functionCode,
          'cors.ts': corsCode
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Failed to deploy ${functionName}:`, error);
      return false;
    }

    console.log(`✅ ${functionName} deployed successfully!`);
    return true;

  } catch (error) {
    console.log(`❌ Error deploying ${functionName}:`, error.message);
    return false;
  }
}

async function deployAllFunctions() {
  console.log('🚀 DEPLOYING TENESTA EDGE FUNCTIONS');
  console.log('=====================================\n');

  let successCount = 0;
  let failCount = 0;

  for (const functionName of functions) {
    const success = await deployFunction(functionName);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📊 DEPLOYMENT SUMMARY');
  console.log('=====================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📦 Total: ${functions.length}`);

  if (successCount === functions.length) {
    console.log('\n🎉 All functions deployed successfully!');
    console.log('\n🧪 Next steps:');
    console.log('1. Run: node run_basic_tests.js');
    console.log('2. Create test users in your database');
    console.log('3. Run: node validate_apis_with_database.js');
  } else {
    console.log('\n⚠️ Some functions failed to deploy');
    console.log('Check the errors above and try again');
  }
}

// Run deployment
deployAllFunctions();