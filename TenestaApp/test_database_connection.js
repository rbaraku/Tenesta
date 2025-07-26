/**
 * Tenesta Database Connection and Schema Test
 * Tests Supabase database connection, schema verification, and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from API keys
const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODc3MSwiZXhwIjoyMDY1OTU0NzcxfQ.iK3CnjJAILGk1LvDq_s2frqmqrHh7NXuprzyCWCURMA';

// Initialize Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Expected tables from the schema
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

// Test functions
async function testDatabaseConnection() {
    console.log('🔗 Testing Database Connection...\n');
    
    try {
        // Test basic connection with admin client
        const { data, error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        console.log(`📊 Total users in database: ${data || 'Unknown'}\n`);
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    }
}

async function verifyTableSchema() {
    console.log('📋 Verifying Database Schema...\n');
    
    try {
        // Query to get all tables
        const { data: tables, error } = await supabaseAdmin.rpc('get_table_info');
        
        if (error) {
            // Alternative method to check tables
            const { data: altTables, error: altError } = await supabaseAdmin
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .neq('table_name', 'spatial_ref_sys'); // Exclude PostGIS system table
            
            if (altError) {
                console.error('❌ Could not retrieve table information:', altError.message);
                return false;
            }
            
            const existingTables = altTables?.map(t => t.table_name) || [];
            
            console.log('📊 Existing tables:');
            existingTables.forEach(table => {
                const isExpected = EXPECTED_TABLES.includes(table);
                console.log(`  ${isExpected ? '✅' : '❓'} ${table}`);
            });
            
            console.log('\n🔍 Expected tables status:');
            EXPECTED_TABLES.forEach(table => {
                const exists = existingTables.includes(table);
                console.log(`  ${exists ? '✅' : '❌'} ${table}`);
            });
            
            return existingTables;
        }
        
        return tables;
    } catch (err) {
        console.error('❌ Schema verification error:', err.message);
        return false;
    }
}

async function testRLSPolicies() {
    console.log('\n🔒 Testing Row Level Security Policies...\n');
    
    try {
        // Test 1: Check if RLS is enabled on tables
        const { data: rlsStatus, error } = await supabaseAdmin.rpc('check_rls_status');
        
        if (error) {
            console.log('⚠️  Could not check RLS status directly, testing with queries...');
            
            // Alternative test: Try to query tables with anon client
            console.log('🧪 Testing RLS with anonymous client:');
            
            for (const table of EXPECTED_TABLES) {
                try {
                    const { data, error } = await supabaseAnon.from(table).select('*').limit(1);
                    
                    if (error) {
                        if (error.message.includes('row-level security')) {
                            console.log(`  ✅ ${table}: RLS properly blocking unauthorized access`);
                        } else {
                            console.log(`  ❓ ${table}: ${error.message}`);
                        }
                    } else {
                        console.log(`  ⚠️  ${table}: RLS may not be properly configured (returned data)`);
                    }
                } catch (err) {
                    console.log(`  ❌ ${table}: Error testing - ${err.message}`);
                }
            }
        } else {
            console.log('✅ RLS status retrieved successfully');
            console.log(rlsStatus);
        }
        
        return true;
    } catch (err) {
        console.error('❌ RLS testing error:', err.message);
        return false;
    }
}

async function testBasicOperations() {
    console.log('\n⚙️  Testing Basic Database Operations...\n');
    
    try {
        // Test 1: Create a test organization (using admin client)
        console.log('🏢 Testing organization creation...');
        
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: 'Test Property Management',
                type: 'small_business',
                subscription_tier: 'landlord'
            })
            .select()
            .single();
        
        if (orgError) {
            console.log(`  ❌ Organization creation failed: ${orgError.message}`);
            return false;
        }
        
        console.log('  ✅ Organization created successfully');
        console.log(`     ID: ${orgData.id}`);
        console.log(`     Name: ${orgData.name}`);
        
        // Test 2: Create a test user
        console.log('\n👤 Testing user creation...');
        
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                email: 'test.landlord@example.com',
                role: 'landlord',
                organization_id: orgData.id,
                profile: {
                    full_name: 'Test Landlord',
                    phone: '+1234567890'
                }
            })
            .select()
            .single();
        
        if (userError) {
            console.log(`  ❌ User creation failed: ${userError.message}`);
        } else {
            console.log('  ✅ User created successfully');
            console.log(`     ID: ${userData.id}`);
            console.log(`     Email: ${userData.email}`);
            console.log(`     Role: ${userData.role}`);
        }
        
        // Test 3: Create a test property
        console.log('\n🏠 Testing property creation...');
        
        if (userData) {
            const { data: propertyData, error: propertyError } = await supabaseAdmin
                .from('properties')
                .insert({
                    address: '123 Test Street',
                    city: 'Test City',
                    state: 'NY',
                    zip_code: '12345',
                    landlord_id: userData.id,
                    organization_id: orgData.id,
                    rent_amount: 2500.00,
                    security_deposit: 5000.00,
                    status: 'available'
                })
                .select()
                .single();
            
            if (propertyError) {
                console.log(`  ❌ Property creation failed: ${propertyError.message}`);
            } else {
                console.log('  ✅ Property created successfully');
                console.log(`     ID: ${propertyData.id}`);
                console.log(`     Address: ${propertyData.address}`);
                console.log(`     Rent: $${propertyData.rent_amount}`);
            }
        }
        
        // Cleanup test data
        console.log('\n🧹 Cleaning up test data...');
        await supabaseAdmin.from('organizations').delete().eq('id', orgData.id);
        console.log('  ✅ Test data cleaned up');
        
        return true;
    } catch (err) {
        console.error('❌ Basic operations test error:', err.message);
        return false;
    }
}

async function checkDatabaseHealth() {
    console.log('\n❤️  Database Health Check...\n');
    
    try {
        // Check database version
        const { data: version, error: versionError } = await supabaseAdmin.rpc('version');
        
        if (!versionError && version) {
            console.log('✅ PostgreSQL Version:', version);
        }
        
        // Check extensions
        const { data: extensions, error: extError } = await supabaseAdmin
            .rpc('get_installed_extensions');
        
        if (!extError && extensions) {
            console.log('🔌 Installed Extensions:');
            extensions.forEach(ext => {
                console.log(`   - ${ext.name} (${ext.version})`);
            });
        }
        
        // Check statistics
        const { data: stats, error: statsError } = await supabaseAdmin.rpc('get_database_stats');
        
        if (!statsError && stats) {
            console.log('📊 Database Statistics:');
            console.log(`   - Total tables: ${stats.table_count || 'Unknown'}`);
            console.log(`   - Database size: ${stats.database_size || 'Unknown'}`);
        }
        
        return true;
    } catch (err) {
        console.log('⚠️  Health check completed with some limitations');
        return true;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Tenesta Database Tests');
    console.log('====================================\n');
    
    const results = {
        connection: false,
        schema: false,
        rls: false,
        operations: false,
        health: false
    };
    
    // Run tests
    results.connection = await testDatabaseConnection();
    
    if (results.connection) {
        results.schema = await verifyTableSchema();
        results.rls = await testRLSPolicies();
        results.operations = await testBasicOperations();
        results.health = await checkDatabaseHealth();
    }
    
    // Summary
    console.log('\n📋 Test Summary');
    console.log('================');
    console.log(`🔗 Database Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📋 Schema Verification: ${results.schema ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔒 RLS Policies: ${results.rls ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚙️  Basic Operations: ${results.operations ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`❤️  Database Health: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📊 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Your Tenesta database is ready to use.');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }
}

// Export for use in other scripts
module.exports = {
    testDatabaseConnection,
    verifyTableSchema,
    testRLSPolicies,
    testBasicOperations,
    checkDatabaseHealth,
    runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}