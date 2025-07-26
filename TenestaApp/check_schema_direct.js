/**
 * Direct Schema and RLS Policy Check for Tenesta Database
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://skjaxjaawqvjjhyxnxls.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODc3MSwiZXhwIjoyMDY1OTU0NzcxfQ.iK3CnjJAILGk1LvDq_s2frqmqrHh7NXuprzyCWCURMA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkExistingTables() {
    console.log('📋 Checking Existing Tables...\n');
    
    try {
        // Query information_schema directly using raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT table_name, table_type
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            `
        });
        
        if (error) {
            console.log('Trying alternative method...');
            
            // Alternative: Use pg_tables
            const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
                sql: `
                    SELECT schemaname, tablename, tableowner, hasindexes, hasrules, hastriggers
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY tablename;
                `
            });
            
            if (altError) {
                console.error('❌ Could not retrieve table information:', altError.message);
                return;
            }
            
            console.log('✅ Found tables using pg_tables:');
            altData.forEach(table => {
                console.log(`  📄 ${table.tablename}`);
                console.log(`     - Owner: ${table.tableowner}`);
                console.log(`     - Has indexes: ${table.hasindexes}`);
                console.log(`     - Has triggers: ${table.hastriggers}`);
                console.log('');
            });
            
            return altData;
        }
        
        console.log('✅ Found tables:');
        data.forEach(table => {
            console.log(`  📄 ${table.table_name} (${table.table_type})`);
        });
        
        return data;
    } catch (err) {
        console.error('❌ Error checking tables:', err.message);
    }
}

async function checkRLSStatus() {
    console.log('\n🔒 Checking RLS Status...\n');
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    rowsecurity as rls_enabled,
                    hasindexes,
                    hastriggers
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            `
        });
        
        if (error) {
            console.error('❌ Could not check RLS status:', error.message);
            return;
        }
        
        console.log('🔒 RLS Status for each table:');
        data.forEach(table => {
            const rlsStatus = table.rls_enabled ? '✅ ENABLED' : '❌ DISABLED';
            console.log(`  ${rlsStatus} ${table.tablename}`);
        });
        
        return data;
    } catch (err) {
        console.error('❌ Error checking RLS:', err.message);
    }
}

async function checkTableColumns() {
    console.log('\n📋 Checking Table Columns...\n');
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    table_name,
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name IN ('organizations', 'users', 'properties', 'tenancies', 'payments', 'documents', 'disputes', 'messages', 'notifications')
                ORDER BY table_name, ordinal_position;
            `
        });
        
        if (error) {
            console.error('❌ Could not retrieve column information:', error.message);
            return;
        }
        
        // Group by table
        const tables = {};
        data.forEach(col => {
            if (!tables[col.table_name]) {
                tables[col.table_name] = [];
            }
            tables[col.table_name].push(col);
        });
        
        Object.keys(tables).sort().forEach(tableName => {
            console.log(`📄 Table: ${tableName}`);
            tables[tableName].forEach(col => {
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
            });
            console.log('');
        });
        
        return tables;
    } catch (err) {
        console.error('❌ Error checking columns:', err.message);
    }
}

async function checkPolicies() {
    console.log('\n🛡️  Checking RLS Policies...\n');
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    policyname,
                    permissive,
                    roles,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies 
                WHERE schemaname = 'public'
                ORDER BY tablename, policyname;
            `
        });
        
        if (error) {
            console.error('❌ Could not retrieve policy information:', error.message);
            return;
        }
        
        if (data.length === 0) {
            console.log('⚠️  No RLS policies found');
            return;
        }
        
        // Group by table
        const tables = {};
        data.forEach(policy => {
            if (!tables[policy.tablename]) {
                tables[policy.tablename] = [];
            }
            tables[policy.tablename].push(policy);
        });
        
        Object.keys(tables).sort().forEach(tableName => {
            console.log(`🛡️  Table: ${tableName}`);
            tables[tableName].forEach(policy => {
                console.log(`   📋 Policy: ${policy.policyname}`);
                console.log(`      - Command: ${policy.cmd || 'ALL'}`);
                console.log(`      - Roles: ${policy.roles ? policy.roles.join(', ') : 'ALL'}`);
                if (policy.qual) {
                    console.log(`      - Condition: ${policy.qual}`);
                }
                console.log('');
            });
        });
        
        return tables;
    } catch (err) {
        console.error('❌ Error checking policies:', err.message);
    }
}

async function checkIndexes() {
    console.log('\n📊 Checking Database Indexes...\n');
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public'
                AND tablename IN ('organizations', 'users', 'properties', 'tenancies', 'payments', 'documents', 'disputes', 'messages', 'notifications')
                ORDER BY tablename, indexname;
            `
        });
        
        if (error) {
            console.error('❌ Could not retrieve index information:', error.message);
            return;
        }
        
        // Group by table
        const tables = {};
        data.forEach(idx => {
            if (!tables[idx.tablename]) {
                tables[idx.tablename] = [];
            }
            tables[idx.tablename].push(idx);
        });
        
        Object.keys(tables).sort().forEach(tableName => {
            console.log(`📊 Table: ${tableName}`);
            tables[tableName].forEach(idx => {
                console.log(`   🔍 ${idx.indexname}`);
            });
            console.log('');
        });
        
        return tables;
    } catch (err) {
        console.error('❌ Error checking indexes:', err.message);
    }
}

async function main() {
    console.log('🔍 Tenesta Database Schema Analysis');
    console.log('===================================\n');
    
    await checkExistingTables();
    await checkRLSStatus();
    await checkTableColumns();
    await checkPolicies();
    await checkIndexes();
    
    console.log('✅ Schema analysis complete!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    checkExistingTables,
    checkRLSStatus,
    checkTableColumns,
    checkPolicies,
    checkIndexes
};