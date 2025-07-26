# Tenesta Authentication Setup Guide

## ✅ What We've Implemented

### 1. **Database Setup**
- ✅ Auth triggers for automatic user profile creation
- ✅ Session management tables
- ✅ Auth attempt tracking for security
- ✅ OAuth connection support
- ✅ Helper functions for validation

### 2. **Edge Functions**
- ✅ `auth-signup` - User registration with validation
- ✅ `auth-login` - Login with lockout protection
- ✅ `auth-password-reset` - Password reset flow

### 3. **Security Features**
- ✅ Password strength validation
- ✅ Email format validation
- ✅ Account lockout after failed attempts
- ✅ Auth attempt logging
- ✅ Session management

## 🔧 Supabase Dashboard Configuration

### Step 1: Enable Email Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Email** provider
3. Configure the following settings:
   ```
   ✓ Enable Email Signup
   ✓ Enable Email Confirmations
   ✓ Enable Secure Email Change
   ✓ Enable Secure Password Change
   ```

### Step 2: Configure Email Templates

Navigate to **Authentication** → **Email Templates** and customize:

#### Confirm Signup Template
```html
<h2>Welcome to Tenesta!</h2>
<p>Hi {{ .Email }},</p>
<p>Thank you for signing up for Tenesta. Please confirm your email address by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email</a></p>
<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
<p>Best regards,<br>The Tenesta Team</p>
```

#### Reset Password Template
```html
<h2>Reset Your Password</h2>
<p>Hi {{ .Email }},</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
<p>Best regards,<br>The Tenesta Team</p>
```

#### Magic Link Template
```html
<h2>Your Tenesta Login Link</h2>
<p>Hi {{ .Email }},</p>
<p>Click the button below to log in to your Tenesta account:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Log In to Tenesta</a></p>
<p>Or copy and paste this link: {{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour and can only be used once.</p>
<p>Best regards,<br>The Tenesta Team</p>
```

### Step 3: Configure Auth Settings

Go to **Authentication** → **URL Configuration**:

```
Site URL: https://your-app-domain.com
Redirect URLs:
- https://your-app-domain.com/auth/callback
- https://your-app-domain.com/auth/reset-password
- tenesta://auth/callback (for mobile app)
```

### Step 4: OAuth Providers Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase: **Authentication** → **Providers** → **Google**
   - Enable Google provider
   - Add Client ID and Client Secret

#### Apple OAuth

1. Enroll in Apple Developer Program
2. Create an App ID with Sign in with Apple capability
3. Create a Service ID for web authentication
4. Configure Return URLs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Create and download a private key
6. In Supabase: **Authentication** → **Providers** → **Apple**
   - Enable Apple provider
   - Add Service ID, Team ID, and Private Key

## 📱 Frontend Implementation

### React Native Setup

```typescript
// utils/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Sign Up Implementation

```typescript
// screens/SignUpScreen.tsx
import { useState } from 'react'
import { supabase } from '../utils/supabase'

export function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant')
  const [loading, setLoading] = useState(false)

  async function signUp() {
    setLoading(true)
    
    const { data, error } = await supabase.functions.invoke('auth-signup', {
      body: {
        email,
        password,
        full_name: fullName,
        phone,
        role
      }
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Please check your email to verify your account!')
    }
    
    setLoading(false)
  }
  
  // ... render form
}
```

### Login Implementation

```typescript
// screens/LoginScreen.tsx
import { useState } from 'react'
import { supabase } from '../utils/supabase'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)
    
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: { email, password }
    })

    if (error) {
      Alert.alert('Error', error.message)
      if (data?.lockout_info?.locked) {
        Alert.alert(
          'Account Locked',
          `Too many failed attempts. Try again in ${Math.ceil(data.lockout_info.remaining_lockout_minutes)} minutes.`
        )
      }
    }
    
    setLoading(false)
  }
  
  // ... render form
}
```

### OAuth Implementation

```typescript
// utils/oauth.ts
import * as AuthSession from 'expo-auth-session'
import { supabase } from './supabase'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: AuthSession.makeRedirectUri({ useProxy: true }),
      skipBrowserRedirect: true,
    },
  })
  
  if (error) throw error
  
  const res = await AuthSession.startAsync({
    authUrl: data.url,
  })
  
  if (res.type === 'success') {
    const { url } = res
    const params = new URLSearchParams(url.split('#')[1])
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }
}
```

## 🔒 Security Best Practices

### 1. **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Never expose this!
```

### 2. **Session Management**
```typescript
// Check session on app start
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
  })

  return () => subscription.unsubscribe()
}, [])
```

### 3. **Protected Routes**
```typescript
// components/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useSession()
  
  if (!session) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}
```

## 📊 Monitoring & Analytics

### Track Authentication Events
```sql
-- View recent auth attempts
SELECT 
  email,
  attempt_type,
  success,
  error_message,
  created_at
FROM auth_attempts
ORDER BY created_at DESC
LIMIT 100;

-- Check for suspicious activity
SELECT 
  email,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM auth_attempts
WHERE success = false
  AND created_at > now() - interval '1 hour'
GROUP BY email
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;
```

### Monitor Active Sessions
```sql
-- View active sessions
SELECT 
  u.email,
  s.created_at,
  s.last_active,
  s.expires_at
FROM auth_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true
  AND s.expires_at > now()
ORDER BY s.last_active DESC;
```

## 🚀 Next Steps

1. **Test Authentication Flows**
   - Sign up with different roles
   - Test email verification
   - Test password reset
   - Test account lockout

2. **Set Up OAuth Providers**
   - Configure Google OAuth
   - Configure Apple OAuth
   - Test OAuth flows

3. **Implement MFA (Optional)**
   - Enable TOTP in Supabase
   - Add MFA setup flow
   - Add MFA verification

4. **Add Analytics**
   - Track signup conversion
   - Monitor login success rates
   - Identify authentication issues

## 📝 Testing Checklist

- [ ] Email signup works
- [ ] Email verification sent
- [ ] Login with correct credentials
- [ ] Login fails with wrong password
- [ ] Account locks after 5 failed attempts
- [ ] Password reset email sent
- [ ] Password reset works with token
- [ ] Strong password validation
- [ ] Session persists on app restart
- [ ] Logout clears session
- [ ] OAuth login works (Google)
- [ ] OAuth login works (Apple)
- [ ] User profile created on signup
- [ ] Organization created for tenants