# Manual Function Deployment Guide

## Deploy messaging-system function to Supabase

Since the CLI requires authentication, here are the steps to deploy manually:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/skjaxjaawqvjjhyxnxls
2. Navigate to "Edge Functions" in the left sidebar
3. Click "Create Function"
4. Function name: `messaging-system`
5. Copy the entire content from `supabase/functions/messaging-system/index.ts`
6. Paste into the function editor
7. Click "Deploy"

### Option 2: Via CLI (requires setup)

1. First login to Supabase:
   ```bash
   npx supabase login
   ```

2. Link to your project:
   ```bash
   npx supabase link --project-ref skjaxjaawqvjjhyxnxls
   ```

3. Deploy the function:
   ```bash
   npx supabase functions deploy messaging-system
   ```

### Verification

After deployment, test with:
```bash
node test_messaging_function.js
```

The function should return a 200 status instead of 404.

## Current Function Status
- ❌ Not deployed (404 error)
- ✅ Code ready in `supabase/functions/messaging-system/index.ts`
- ⚠️  RLS issue blocking user profile lookup