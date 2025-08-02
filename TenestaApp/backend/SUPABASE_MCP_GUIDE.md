# Supabase MCP Integration Guide

## Overview
The Supabase MCP (Model Context Protocol) is already configured for the Tenesta project. This allows direct interaction with your Supabase project through Claude.

## Configuration
Your MCP is configured in `mcp-config.json` with:
- **Project Reference:** `skjaxjaawqvjjhyxnxls`
- **Access Token:** Configured (keep this secret!)

## Available MCP Commands

### Database Operations
- Query tables directly
- Run SQL commands
- Manage RLS policies
- View table schemas

### Edge Functions
- Deploy functions
- View function logs
- Test function endpoints

### Authentication
- Manage users
- Configure auth settings
- View auth logs

## Using MCP for Deployment

### 1. Deploy Edge Functions via MCP
Instead of using the CLI, you can deploy functions through the MCP:

```javascript
// Example: Deploy tenant-dashboard function
mcp.supabase.functions.deploy('tenant-dashboard', {
  source: './supabase/functions/tenant-dashboard/index.ts'
})
```

### 2. Create Auth Users via MCP
```javascript
// Example: Create test users
mcp.supabase.auth.admin.createUser({
  email: 'tenant@test.com',
  password: 'Test123!@#',
  email_confirm: true
})
```

### 3. Run SQL via MCP
```javascript
// Example: Apply security fixes
mcp.supabase.sql.query(`
  DROP FUNCTION IF EXISTS get_user_role(UUID);
  CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
  RETURNS TEXT AS $$
  BEGIN
      RETURN (
          SELECT role FROM public.users 
          WHERE id = user_id
      );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
`)
```

## Security Best Practices

1. **Never commit `mcp-config.json`** - It contains sensitive tokens
2. **Use `.mcp-config.example.json`** as a template for other developers
3. **Rotate access tokens regularly** through Supabase dashboard
4. **Limit MCP permissions** to only what's needed

## MCP vs Manual Deployment

### When to use MCP:
- Quick database queries during development
- Testing RLS policies
- Managing auth users
- Viewing real-time logs

### When to use Dashboard/CLI:
- Production deployments
- Complex migrations
- Team collaboration
- CI/CD pipelines

## Troubleshooting

### MCP Connection Issues
1. Verify access token is valid in Supabase dashboard
2. Check project reference matches your project
3. Ensure MCP server is running: `npx @supabase/mcp-server-supabase@latest`

### Permission Errors
1. Check access token has required permissions
2. Verify RLS policies aren't blocking operations
3. Use service role key for admin operations

## Next Steps

With MCP configured, you can:
1. Deploy functions without CLI
2. Manage database directly
3. Create and manage test users
4. Monitor real-time logs
5. Test API endpoints

The MCP integration makes development faster and more interactive!