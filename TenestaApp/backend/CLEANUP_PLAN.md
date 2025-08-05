# Backend Cleanup Plan

## Files to Remove (Test Scripts & Temporary Files)

### Test Scripts (No longer needed)
- apply_rls_fix.js
- apply_rls_fix_admin.js
- check_table_columns.js
- create_mcp_test_direct.js
- create_test_table.js
- create_test_table_admin.js
- create_test_table_direct.js
- execute_mcp_test_sql.js
- fix_all_rls_recursion.js
- fix_rls_correct_columns.js
- fix_rls_via_api.js
- rls_emergency_fix.js
- run_basic_tests.js
- run_security_fixes.js
- setup_messaging_data.js
- test_api_endpoints.js
- test_authentication.js
- test_document_api.js
- test_existing_tables.js
- test_mcp_access.js
- test_messaging_api.js
- test_messaging_function.js
- test_table_with_sql.js
- verify_function_deployment.js
- verify_test_table.js
- validate_apis_with_database.js
- get_supabase_info.js

### SQL Test Files (No longer needed)
- create_mcp_test_table.sql
- create_simple_test_table.sql
- create_test_data.sql
- create_test_messages.sql
- test_complete_functionality.sql
- test_database.sql
- test_schema_fixes.sql
- comprehensive_functionality_test.sql
- simple_diagnostic.sql
- complete_database_diagnostic.sql

### Fix/Migration Scripts (Already applied)
- fix_cascade_dependencies.sql
- fix_function_parameter_ambiguity.sql
- fix_missing_tables.sql
- fix_tenancies_status_column.sql
- fix_tenant_linking.sql
- fix_users_rls_recursion.sql
- force_drop_functions.sql
- corrected_rls_for_actual_structure.sql
- final_corrected_rls.sql
- final_fixed_rls.sql
- fix_rls_recursion.sql
- fix_rls_simple.sql
- production_rls_all_tables.sql
- restore_full_rls_protection.sql
- safe_bootstrap_database.sql
- deploy_critical_fixes.sql

### Diagnostic Scripts (No longer needed)
- check_actual_schema.sql
- check_database_structure.sql
- check_function_signatures.sql
- check_payment_constraints.sql
- diagnose_database.sql
- get_column_info.sql
- get_missing_info.sql

### Setup Scripts (Already used)
- setup_test_data_correct.sql
- setup_test_data_step1.sql
- setup_test_data_step2.sql
- setup_test_data_step3.sql
- setup_storage_bucket.sql

### Installation Scripts (No longer needed)
- install_supabase.bat
- install_supabase_cli.ps1
- supabase.exe (CLI binary, should use npm version)

### Deployment Scripts (Keep for reference)
- deploy_functions.bat
- deploy_functions.sh
- deploy_functions_api.js

## Files to Keep

### Core Database Schema
- database_schema.sql
- complete_schema_update.sql

### Security Scripts (Important reference)
- fix_function_security.sql
- fix_function_security_correct.sql
- fix_function_security_safe.sql
- fix_function_security_v2.sql

### Documentation (Important)
- API_DEVELOPMENT_SUMMARY.md
- DEPLOYMENT_GUIDE.md
- MCP_SUPABASE_EXECUTION_REPORT.md
- MCP_TEST_TABLE_SETUP.md
- SUPABASE_MCP_GUIDE.md
- deploy_function_manual.md

### Supabase Structure
- supabase/ (entire directory with functions and migrations)
- config/ (configuration files)
- types/ (TypeScript types)

## New Directory Structure (Proposed)

```
backend/
├── docs/
│   ├── API_DEVELOPMENT_SUMMARY.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── MCP_SUPABASE_EXECUTION_REPORT.md
│   ├── MCP_TEST_TABLE_SETUP.md
│   └── SUPABASE_MCP_GUIDE.md
├── scripts/
│   ├── deploy/
│   │   ├── deploy_functions.bat
│   │   ├── deploy_functions.sh
│   │   └── deploy_functions_api.js
│   └── security/
│       ├── fix_function_security.sql
│       ├── fix_function_security_correct.sql
│       ├── fix_function_security_safe.sql
│       └── fix_function_security_v2.sql
├── database/
│   ├── schema/
│   │   ├── database_schema.sql
│   │   └── complete_schema_update.sql
│   └── migrations/
│       └── (keep important migration files)
├── supabase/
│   └── (existing structure)
├── config/
│   └── (existing config files)
└── types/
    └── (existing TypeScript types)
```