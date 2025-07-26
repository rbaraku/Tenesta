# Tenesta Authentication Testing Commands

## Environment Setup
```bash
# Set your environment variables
export SUPABASE_URL="https://skjaxjaawqvjjhyxnxls.supabase.co"
export ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0"
```

## 1. Test User Sign Up

### Success Case - Strong Password
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/auth-signup" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "tenant"
  }'
```

### Failure Case - Weak Password
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/auth-signup" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "weak",
    "full_name": "Weak User",
    "role": "tenant"
  }'
```

### Failure Case - Duplicate Email
```bash
# Run this twice to test duplicate email handling
curl -X POST "${SUPABASE_URL}/functions/v1/auth-signup" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "DuplicateTest123!",
    "full_name": "Duplicate User",
    "role": "landlord"
  }'
```

## 2. Test User Login

### Success Case
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/auth-login" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#"
  }'
```

### Failure Case - Wrong Password
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/auth-login" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "WrongPassword123!"
  }'
```

## 3. Test Account Lockout

### Trigger Lockout (Run 6 times)
```bash
# This script will make 6 failed login attempts to trigger lockout
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST "${SUPABASE_URL}/functions/v1/auth-login" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "lockout.test@example.com",
      "password": "WrongPassword!"
    }'
  echo "\n"
  sleep 1
done
```

## 4. Test Password Reset

### Request Password Reset
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/auth-password-reset/request" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### Reset Password with Token (After receiving email)
```bash
curl -X POST "${SUPABASE_URL}/functions/v1/auth-password-reset/confirm" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_FROM_EMAIL",
    "password": "NewSecurePass123!@#"
  }'
```

## 5. Database Verification Queries

### Check Created Users
```bash
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
  }'
```

### Check Auth Attempts
```bash
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT email, attempt_type, success, error_message, created_at FROM auth_attempts ORDER BY created_at DESC LIMIT 10"
  }'
```

### Check Organizations Created
```bash
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT id, name, type, subscription_tier FROM organizations ORDER BY created_at DESC LIMIT 5"
  }'
```

## 6. Test Password Strength Validation

```bash
# Test various password strengths
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/is_strong_password" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "weak"
  }'

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/is_strong_password" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "StrongPass123!@#"
  }'
```

## Expected Test Results

### ✅ Successful Tests Should Show:

1. **Sign Up Success**
   - Returns: `{"message": "Registration successful! Please check your email to verify your account."}`
   - Creates user in `users` table
   - Creates organization for tenants
   - Logs successful auth attempt

2. **Login Success**
   - Returns user profile and session
   - Creates auth session record
   - Updates last_active timestamp

3. **Account Lockout**
   - After 5 failed attempts, returns lockout info
   - Shows remaining lockout time
   - Prevents further login attempts

4. **Password Reset**
   - Sends email (check Supabase dashboard logs)
   - Returns success message

### ❌ Expected Failures:

1. **Weak Password**
   - Returns password strength feedback
   - Lists missing requirements

2. **Duplicate Email**
   - Returns "An account with this email already exists"

3. **Invalid Credentials**
   - Returns "Invalid email or password"
   - Logs failed attempt

## Monitoring Commands

### View Recent Sign Ups
```sql
SELECT 
    u.email,
    u.role,
    u.created_at,
    o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC
LIMIT 10;
```

### Check Failed Login Attempts
```sql
SELECT 
    email,
    COUNT(*) as failed_attempts,
    MAX(created_at) as last_attempt
FROM auth_attempts
WHERE success = false
    AND attempt_type = 'login'
    AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY failed_attempts DESC;
```

### View Active Sessions
```sql
SELECT 
    u.email,
    s.created_at as session_start,
    s.last_active,
    s.expires_at
FROM auth_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true
ORDER BY s.last_active DESC;
```