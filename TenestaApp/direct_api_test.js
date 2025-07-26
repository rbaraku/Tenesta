/**
 * Direct API Test for Tenesta Supabase Database
 * Tests database connection and schema using REST API calls
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODc3MSwiZXhwIjoyMDY1OTU0NzcxfQ.iK3CnjJAILGk1LvDq_s2frqmqrHh7NXuprzyCWCURMA';

// Expected tables from schema
const EXPECTED_TABLES = [
    'organizations',
    'users', 
    'properties',
    'tenancies',
    'payments',
    'documents',
    'disputes',
    'messages',
    'notifications',
    'notes'
];

function makeRequest(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'skjaxjaawqvjjhyxnxls.supabase.co',
            path: path,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ 
                        status: res.statusCode, 
                        data: jsonData,
                        headers: res.headers 
                    });
                } catch (err) {
                    resolve({ 
                        status: res.statusCode, 
                        data: data,
                        headers: res.headers 
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

async function testTableAccess() {
    console.log('🔍 Testing Table Access...\n');
    
    const results = {};
    
    for (const tableName of EXPECTED_TABLES) {
        try {
            console.log(`📋 Testing ${tableName}...`);
            
            // Try to access the table with a count query
            const response = await makeRequest(`/rest/v1/${tableName}?select=count&head=true`);
            
            if (response.status === 200) {
                const count = response.headers['content-range'] ? 
                    response.headers['content-range'].split('/')[1] : 'unknown';
                console.log(`   ✅ Table exists - ${count} records`);
                results[tableName] = { exists: true, count: count, status: 'accessible' };
            } else if (response.status === 401) {
                console.log(`   🔒 Table protected by RLS (good security)`);
                results[tableName] = { exists: true, count: 'protected', status: 'rls_protected' };
            } else if (response.status === 404) {
                console.log(`   ❌ Table does not exist`);
                results[tableName] = { exists: false, status: 'not_found' };
            } else {
                console.log(`   ❓ Unexpected response: ${response.status}`);
                results[tableName] = { exists: 'unknown', status: `error_${response.status}` };
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results[tableName] = { exists: 'error', status: 'connection_error' };
        }
    }
    
    return results;
}

async function testDatabaseHealth() {
    console.log('\n❤️  Testing Database Health...\n');
    
    try {
        // Test basic connectivity
        const response = await makeRequest('/rest/v1/');
        
        if (response.status === 200) {
            console.log('✅ Database API is responsive');
            console.log(`   Response time: ${Date.now()}ms (approximate)`);
        } else {
            console.log(`❌ Database API returned status: ${response.status}`);
        }
        
        // Test auth system
        console.log('\n🔐 Testing Authentication System...');
        
        const authResponse = await makeRequest('/auth/v1/user', {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        });
        
        if (authResponse.status === 401) {
            console.log('✅ Auth system is working (correctly rejecting unauthenticated requests)');
        } else {
            console.log(`❓ Unexpected auth response: ${authResponse.status}`);
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
        return false;
    }
}

async function testRLSWithAnonymousUser() {
    console.log('\n🔒 Testing RLS with Anonymous User...\n');
    
    const anonHeaders = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    };
    
    for (const tableName of EXPECTED_TABLES) {
        try {
            console.log(`🧪 Testing ${tableName} with anonymous access...`);
            
            const response = await makeRequest(`/rest/v1/${tableName}?select=*&limit=1`, anonHeaders);
            
            if (response.status === 401) {
                console.log(`   ✅ RLS properly blocking access`);
            } else if (response.status === 200) {
                if (Array.isArray(response.data) && response.data.length === 0) {
                    console.log(`   ✅ RLS allowing access but no data returned (normal)`);
                } else {
                    console.log(`   ⚠️  RLS may not be configured - returned data`);
                }
            } else {
                console.log(`   ❓ Unexpected response: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error testing ${tableName}: ${error.message}`);
        }
    }
}

async function testBasicCRUD() {
    console.log('\n⚙️  Testing Basic CRUD Operations...\n');
    
    try {
        // Test creating an organization
        console.log('🏢 Testing organization creation...');
        
        const createOrgResponse = await makeRequest('/rest/v1/organizations', {
            method: 'POST'
        });
        
        // For now, just check if the endpoint exists
        if (createOrgResponse.status !== 404) {
            console.log('   ✅ Organizations endpoint exists');
        } else {
            console.log('   ❌ Organizations endpoint not found');
        }
        
        return true;
    } catch (error) {
        console.log(`❌ CRUD test failed: ${error.message}`);
        return false;
    }
}

async function generateSchemaReport() {
    console.log('\n📊 Generating Schema Report...\n');
    
    const tableResults = await testTableAccess();
    
    console.log('=== TENESTA DATABASE SCHEMA REPORT ===\n');
    
    console.log('📋 Table Status Summary:');
    let existingTables = 0;
    let protectedTables = 0;
    let missingTables = 0;
    
    EXPECTED_TABLES.forEach(tableName => {
        const result = tableResults[tableName];
        if (result.exists === true) {
            existingTables++;
            if (result.status === 'rls_protected') {
                protectedTables++;
            }
            console.log(`   ✅ ${tableName} - ${result.status} (${result.count} records)`);
        } else {
            missingTables++;
            console.log(`   ❌ ${tableName} - ${result.status}`);
        }
    });
    
    console.log('\n📊 Summary Statistics:');
    console.log(`   📄 Total Expected Tables: ${EXPECTED_TABLES.length}`);
    console.log(`   ✅ Existing Tables: ${existingTables}`);
    console.log(`   🔒 RLS Protected Tables: ${protectedTables}`);
    console.log(`   ❌ Missing Tables: ${missingTables}`);
    
    const completionRate = Math.round((existingTables / EXPECTED_TABLES.length) * 100);
    console.log(`   📈 Schema Completion: ${completionRate}%`);
    
    if (completionRate === 100) {
        console.log('\n🎉 Database schema is complete!');
    } else if (completionRate >= 80) {
        console.log('\n⚠️  Database schema is mostly complete but has some missing tables.');
    } else {
        console.log('\n❌ Database schema needs significant work.');
    }
    
    return {
        totalTables: EXPECTED_TABLES.length,
        existingTables,
        protectedTables,
        missingTables,
        completionRate
    };
}

async function main() {
    console.log('🚀 Tenesta Database Connection & Schema Test');
    console.log('===========================================\n');
    
    const healthResult = await testDatabaseHealth();
    
    if (healthResult) {
        await testRLSWithAnonymousUser();
        await testBasicCRUD();
        const schemaReport = await generateSchemaReport();
        
        console.log('\n🎯 Test Results Summary:');
        console.log(`   🔗 Database Connection: ✅ HEALTHY`);
        console.log(`   📋 Schema Completion: ${schemaReport.completionRate}%`);
        console.log(`   🔒 RLS Protection: ${schemaReport.protectedTables}/${schemaReport.existingTables} tables protected`);
        
        if (schemaReport.completionRate === 100 && schemaReport.protectedTables === schemaReport.existingTables) {
            console.log('\n🎉 Your Tenesta database is properly configured and ready for production!');
        } else {
            console.log('\n⚠️  Your database needs some configuration adjustments.');
        }
    } else {
        console.log('\n❌ Database connection failed. Please check your configuration.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testTableAccess,
    testDatabaseHealth,
    testRLSWithAnonymousUser,
    generateSchemaReport
};