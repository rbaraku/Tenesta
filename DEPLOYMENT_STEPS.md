# 🚀 Tenesta Backend Deployment Steps

## Current Status: ❌ Functions Not Deployed
Test results show all 8 endpoints are returning 404, confirming they need to be deployed.

## Step 1: Apply Database Security Fixes

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `TenestaApp/backend/fix_function_security.sql`
3. Paste and click **RUN**
4. Should see: "9 functions updated with secure search paths"

## Step 2: Deploy Edge Functions Manually

Since CLI installation failed, deploy through Supabase Dashboard:

### 2A. Go to Functions Dashboard
- **Supabase Dashboard** → **Edge Functions**
- Click **"Create a new function"**

### 2B. Create Each Function

For each function, create with these names and copy the TypeScript code:

#### 1. **tenant-dashboard**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/tenant-dashboard/index.ts
```

#### 2. **landlord-dashboard** 
```typescript
// Copy from: TenestaApp/backend/supabase/functions/landlord-dashboard/index.ts
```

#### 3. **property-management**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/property-management/index.ts
```

#### 4. **maintenance-requests**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/maintenance-requests/index.ts
```

#### 5. **household-management**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/household-management/index.ts
```

#### 6. **support-tickets**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/support-tickets/index.ts
```

#### 7. **dispute-management**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/dispute-management/index.ts
```

#### 8. **payment-process**
```typescript
// Copy from: TenestaApp/backend/supabase/functions/payment-process/index.ts
```

## Step 3: Create Test Authentication Users

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** for each:

| Email | Password | Confirm Email |
|-------|----------|---------------|
| `landlord@test.com` | `Test123!@#` | ✅ Yes |
| `tenant@test.com` | `Test123!@#` | ✅ Yes |
| `admin@test.com` | `Test123!@#` | ✅ Yes |
| `maintenance@test.com` | `Test123!@#` | ✅ Yes |

## Step 4: Create Test Database Data

Go to **SQL Editor** and run:

```sql
-- Create test organization
INSERT INTO organizations (id, name, type, subscription_tier, created_at, updated_at) 
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Property Management', 
    'small_business', 
    'landlord_pro',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create database users
INSERT INTO users (id, email, role, first_name, last_name, organization_id, created_at, updated_at) VALUES
    ('22222222-2222-2222-2222-222222222222', 'landlord@test.com', 'landlord', 'John', 'Landlord', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'tenant@test.com', 'tenant', 'Jane', 'Tenant', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'admin@test.com', 'admin', 'Admin', 'User', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'maintenance@test.com', 'maintenance', 'Mike', 'Maintenance', '11111111-1111-1111-1111-111111111111', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test property
INSERT INTO properties (id, landlord_id, organization_id, name, address, city, state, zip_code, property_type, bedrooms, bathrooms, square_feet, rent_amount, created_at, updated_at) VALUES
    ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Test Apartment', '123 Test St', 'Test City', 'CA', '12345', 'apartment', 2, 1, 800, 1200.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test tenancy
INSERT INTO tenancies (id, tenant_id, property_id, organization_id, start_date, rent_amount, security_deposit, status, created_at, updated_at) VALUES
    ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '2024-01-01', 1200.00, 2400.00, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test payment
INSERT INTO payments (id, tenancy_id, organization_id, amount, due_date, status, created_at, updated_at) VALUES
    ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 1200.00, '2024-08-01', 'pending', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

## Step 5: Link Auth Users to Database Users

After creating auth users:

1. Get auth user IDs:
```sql
SELECT id, email FROM auth.users ORDER BY email;
```

2. Copy the UUIDs and update database users:
```sql
-- Replace 'AUTH_UUID_HERE' with actual UUIDs from previous query
UPDATE users SET auth_user_id = 'AUTH_UUID_FOR_ADMIN' WHERE email = 'admin@test.com';
UPDATE users SET auth_user_id = 'AUTH_UUID_FOR_LANDLORD' WHERE email = 'landlord@test.com';
UPDATE users SET auth_user_id = 'AUTH_UUID_FOR_TENANT' WHERE email = 'tenant@test.com';
UPDATE users SET auth_user_id = 'AUTH_UUID_FOR_MAINTENANCE' WHERE email = 'maintenance@test.com';
```

## Step 6: Test Deployment

After completing all steps, run the test:

```bash
cd "TenestaApp/backend"
node run_basic_tests.js
```

Should show ✅ for all 8 endpoints!

## ⚡ Quick Verification

Test one endpoint manually:
```bash
curl -X GET "https://skjaxjaawqvjjhyxnxls.supabase.co/functions/v1/tenant-dashboard" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2amp5eHhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5ODQwNDQsImV4cCI6MjA1MzU2MDA0NH0.RmKwYyNRLZN6PJSEOErmQFWdlHTW4LL0FRlz4a9-LLU"
```

Should return: `{"error": "No token provided"}` (not 404)

## 🎯 Success Criteria

- [ ] Security fixes applied
- [ ] All 8 functions deployed
- [ ] 4 auth users created
- [ ] Test data inserted
- [ ] Auth users linked
- [ ] Tests passing

Your backend will be ready for full testing!