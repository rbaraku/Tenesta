# Tenesta Backend Deployment Guide

## 🎯 Current Status
✅ **Database Schema:** 45 tables with RLS enabled  
✅ **API Functions:** 8 comprehensive endpoints created  
✅ **Security Fixes:** Ready to deploy  
✅ **Test Scripts:** Validation suite ready  
✅ **Connectivity:** Anon key working, database accessible  

## 📋 Deployment Steps

### Step 1: Apply Database Security Fixes
**Location:** `fix_function_security.sql`

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `fix_function_security.sql`
4. Click **RUN** to execute

**What this does:**
- Updates 9 functions with secure search paths
- Fixes security warnings identified in your database
- Adds new helper functions for access control

### Step 2: Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```
Or download from: https://supabase.com/docs/guides/cli

### Step 3: Login to Supabase CLI
```bash
supabase login
```

### Step 4: Deploy API Functions
**Option A - Windows:**
```bash
./deploy_functions.bat
```

**Option B - Mac/Linux:**
```bash
chmod +x deploy_functions.sh
./deploy_functions.sh
```

**Option C - Manual (one by one):**
```bash
supabase functions deploy tenant-dashboard --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy landlord-dashboard --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy property-management --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy maintenance-requests --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy household-management --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy support-tickets --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy dispute-management --project-ref skjaxjaawqvjjhyxnxls
supabase functions deploy payment-process --project-ref skjaxjaawqvjjhyxnxls
```

### Step 5: Create Test Data
**Location:** `create_test_data.sql`

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste the contents of `create_test_data.sql`
3. Execute to create test organization, users, properties, etc.

### Step 6: Create Authentication Users
The test data script creates database users, but you also need auth users:

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Add User** for each test user:
   - `landlord@test.com` (password: `Test123!@#`)
   - `tenant@test.com` (password: `Test123!@#`)  
   - `admin@test.com` (password: `Test123!@#`)
   - `maintenance@test.com` (password: `Test123!@#`)

3. After creating auth users, update the `auth_user_id` field:
```sql
-- Get the auth user IDs from auth.users table
SELECT id, email FROM auth.users;

-- Update the users table with auth_user_id values
UPDATE users SET auth_user_id = 'auth-uuid-here' WHERE email = 'landlord@test.com';
UPDATE users SET auth_user_id = 'auth-uuid-here' WHERE email = 'tenant@test.com';
UPDATE users SET auth_user_id = 'auth-uuid-here' WHERE email = 'admin@test.com';
UPDATE users SET auth_user_id = 'auth-uuid-here' WHERE email = 'maintenance@test.com';
```

### Step 7: Test Deployment
```bash
node run_basic_tests.js
```

Should now show ✅ for all endpoint availability tests.

### Step 8: Run Full API Validation
```bash
node validate_apis_with_database.js
```

## 🔧 API Endpoints Deployed

### 1. **Tenant Dashboard** (`/tenant-dashboard`)
- GET: Complete tenant dashboard with payments, disputes, notifications

### 2. **Landlord Dashboard** (`/landlord-dashboard`)  
- GET: Portfolio overview, rent collection, property analytics

### 3. **Property Management** (`/property-management`)
- **Actions:** `create_property`, `update_property`, `delete_property`, `get_property`, `list_properties`
- **Tenancy:** `create_tenancy`, `update_tenancy`, `terminate_tenancy`, `get_tenancy`, `list_tenancies`

### 4. **Maintenance Requests** (`/maintenance-requests`)
- **Actions:** `create`, `update`, `get`, `list`, `assign`, `complete`
- **Categories:** plumbing, electrical, hvac, appliance, structural, pest, other

### 5. **Household Management** (`/household-management`)
- **Members:** `add_member`, `remove_member`, `update_member`, `list_members`
- **Tasks:** `create_task`, `update_task`, `complete_task`, `list_tasks`
- **Payments:** `create_split_payment`, `update_split_payment`, `list_split_payments`

### 6. **Support Tickets** (`/support-tickets`)
- **Actions:** `create_ticket`, `update_ticket`, `get_ticket`, `list_tickets`
- **Messages:** `add_message`, `get_messages`
- **Management:** `close_ticket`, `reopen_ticket`

### 7. **Dispute Management** (`/dispute-management`)
- **Actions:** `create`, `update`, `resolve`, `get`, `list`
- **Categories:** maintenance, payment, lease_violation, noise, damage, other

### 8. **Payment Processing** (`/payment-process`)
- **Actions:** `create_intent`, `confirm_payment`, `get_status`, `mark_paid`, `schedule_payment`
- **Integration:** Stripe payment processing ready

## 🧪 Testing

### Basic Connectivity Test
```javascript
// Test endpoint availability
fetch('https://skjaxjaawqvjjhyxnxls.supabase.co/functions/v1/tenant-dashboard', {
  method: 'OPTIONS',
  headers: { 'apikey': 'your-anon-key' }
})
```

### Authentication Test  
```javascript
// Test with auth token
fetch('https://skjaxjaawqvjjhyxnxls.supabase.co/functions/v1/tenant-dashboard', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer jwt-token-here',
    'apikey': 'your-anon-key'
  }
})
```

## 🔒 Security Features

- **Row Level Security:** All 45 tables protected
- **Function Security:** Secure search paths applied
- **Role-Based Access:** tenant/landlord/admin/staff/maintenance roles
- **Data Isolation:** Organization-level data separation
- **Input Validation:** Comprehensive validation on all endpoints
- **Audit Logging:** All critical operations logged

## 📊 Database Coverage

**API Coverage: 18/45 tables (~40%)**
- ✅ Core: organizations, users, properties, tenancies, payments
- ✅ Communication: messages, notifications, disputes
- ✅ Maintenance: maintenance_requests  
- ✅ Household: household_members, shared_tasks, split_payments
- ✅ Support: support_tickets, support_messages
- ✅ Documents: documents, notes

## 🚀 Next Steps After Deployment

1. **Stripe Integration:** Add your Stripe keys to environment variables
2. **Email Configuration:** Set up email templates and SMTP
3. **File Upload:** Configure storage buckets for documents
4. **Real-time Features:** Test websocket subscriptions
5. **Performance:** Monitor function execution times
6. **Monitoring:** Set up error tracking and analytics

## 🐛 Troubleshooting

### Functions Not Deploying
- Check Supabase CLI is logged in: `supabase auth login`
- Verify project ref: `skjaxjaawqvjjhyxnxls`
- Check function syntax errors in files

### Authentication Issues  
- Verify JWT tokens are valid
- Check user exists in both `auth.users` and `users` tables
- Confirm `auth_user_id` is properly linked

### RLS Policy Issues
- Test with service role key for debugging
- Check user has proper organization association
- Verify helper functions are working

### API Errors
- Check Supabase logs in dashboard
- Verify request format matches expected interface
- Test with basic examples first

## 📞 Support

If you encounter issues:
1. Check the test scripts output for specific errors
2. Review Supabase function logs in dashboard  
3. Test individual endpoints with curl/Postman
4. Verify database data exists and is properly linked