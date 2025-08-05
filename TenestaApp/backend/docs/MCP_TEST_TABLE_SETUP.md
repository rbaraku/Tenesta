# MCP Test Table Setup Guide

This guide explains how to create and test a simple table in Supabase to verify write access is working properly for MCP (Model Context Protocol) operations.

## Overview

The test table `mcp_test_table` is designed to verify that all basic database operations (CREATE, READ, UPDATE, DELETE) work correctly through the Supabase client.

## Table Structure

```sql
CREATE TABLE mcp_test_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    test_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### Step 1: Create the Table in Supabase

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Execute the SQL script from `create_simple_test_table.sql`

**Option A: Copy SQL directly**
```sql
-- Create a simple test table with minimal RLS for MCP testing
-- This table is designed to be accessible for testing write operations

-- Drop table if it exists
DROP TABLE IF EXISTS mcp_test_table;

-- Create the test table
CREATE TABLE mcp_test_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    test_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE mcp_test_table ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for testing
-- WARNING: This is for testing only - do not use in production
CREATE POLICY "Allow all operations for testing" ON mcp_test_table
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON mcp_test_table TO anon;
GRANT ALL ON mcp_test_table TO authenticated;

-- Insert sample records to verify the table works
INSERT INTO mcp_test_table (name, description, test_data) VALUES 
('Initial Test Record', 'This record was created during table setup', '{"created_by": "sql_script", "purpose": "initial_test"}'),
('Second Test Record', 'This confirms multiple inserts work', '{"created_by": "sql_script", "purpose": "multi_insert_test"}');
```

**Option B: Run the script**
```bash
# The complete SQL is available in the file:
cat create_simple_test_table.sql
```

### Step 2: Verify the Table Works

After creating the table, run the verification script:

```bash
node verify_test_table.js
```

This will test all CRUD operations:
- ✅ SELECT (read data)
- ✅ INSERT (create new records)
- ✅ UPDATE (modify existing records)
- ✅ DELETE (remove records)
- ✅ Filtered queries
- ✅ Count operations

## Expected Output

When the verification runs successfully, you should see:

```
🚀 Starting mcp_test_table verification...

🔍 Quick check: Does mcp_test_table exist?
✅ Table exists and is accessible

✅ Verifying mcp_test_table is working...
📖 Test 1: Reading existing data...
✅ Read successful! Found 2 records:
   1. Initial Test Record (ID: 12345678...)
   2. Second Test Record (ID: 87654321...)

📝 Test 2: Inserting new record...
✅ Insert successful! New record created:
   ID: abcd1234-...
   Name: Verification Test 10:30:45 AM

📝 Test 3: Updating the record...
✅ Update successful!

🔍 Test 4: Testing filtered queries...
✅ Filter query successful! Found 1 matching records

📊 Test 5: Counting total records...
✅ Total records in table: 3

🧹 Test 6: Cleaning up test record...
✅ Test record cleaned up successfully

🎉 All tests completed successfully!
```

## Files Created

1. **`create_simple_test_table.sql`** - SQL script to create the table
2. **`test_table_with_sql.js`** - Shows the SQL to run manually
3. **`verify_test_table.js`** - Comprehensive verification script
4. **`create_test_table_direct.js`** - Direct database access testing
5. **`MCP_TEST_TABLE_SETUP.md`** - This documentation

## Row Level Security (RLS) Configuration

The test table uses a permissive RLS policy for testing purposes:

```sql
CREATE POLICY "Allow all operations for testing" ON mcp_test_table
    FOR ALL 
    USING (true)
    WITH CHECK (true);
```

**⚠️ WARNING**: This policy allows all operations for testing. In production, you would use more restrictive policies.

## Troubleshooting

### Table Doesn't Exist
If you get "relation 'public.mcp_test_table' does not exist":
1. Make sure you ran the SQL script in Supabase SQL Editor
2. Check that the script executed without errors
3. Verify you're connected to the correct database

### RLS Policy Violations
If you get "new row violates row-level security policy":
1. Ensure the RLS policy was created correctly
2. Check that permissions were granted to `anon` and `authenticated` roles
3. Verify the policy allows the operation you're trying to perform

### Connection Issues
If you get connection errors:
1. Check your Supabase URL and API keys
2. Verify your internet connection
3. Ensure Supabase service is operational

## Security Notes

- This test table is designed for development/testing only
- The RLS policy is intentionally permissive for testing purposes
- In production, implement proper authentication and authorization
- Consider removing the test table after verification is complete

## Usage in Applications

After verification, you can use this pattern for other tables:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Insert a record
const { data, error } = await supabase
  .from('mcp_test_table')
  .insert([{ name: 'Test', description: 'Example' }])
  .select();

// Query records
const { data, error } = await supabase
  .from('mcp_test_table')
  .select('*')
  .eq('name', 'Test');
```

## Cleanup

To remove the test table when no longer needed:

```sql
DROP TABLE IF EXISTS mcp_test_table;
```

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your database permissions
3. Review the RLS policies
4. Test with authenticated users if anonymous access fails