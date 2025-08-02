# Supabase MCP Setup Guide for Claude Code

## Step 1: Configure Claude Code Settings

You need to add the Supabase MCP to your Claude Code configuration. Here's how:

### Option 1: Via Claude Code Settings UI
1. Open Claude Code
2. Go to Settings (Ctrl/Cmd + ,)
3. Navigate to "MCP Servers" or "Extensions"
4. Add a new MCP server configuration

### Option 2: Manual Configuration File
Create or edit your Claude Code settings file with the Supabase MCP configuration:

**Location of settings file:**
- Windows: `%APPDATA%\Claude Code\settings.json`
- macOS: `~/Library/Application Support/Claude Code/settings.json`
- Linux: `~/.config/claude-code/settings.json`

**Add this configuration:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["supabase-mcp"],
      "env": {
        "SUPABASE_URL": "https://skjaxjaawqvjjhyxnxls.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODc3MSwiZXhwIjoyMDY1OTU0NzcxfQ.9LZPJ0W6EKq_L_FJhP-0g4Qwl23zQdKIGIkNKm7lB2o"
      }
    }
  }
}
```

### Alternative Configuration (if above doesn't work):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["-e", "require('supabase-mcp')"],
      "env": {
        "SUPABASE_URL": "https://skjaxjaawqvjjhyxnxls.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzg3NzEsImV4cCI6MjA2NTk1NDc3MX0.ymoyzzqJtAjWejrTqUTsMjKTYh0iZQxAzpKpgJx6OB0",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNramF4amFhd3F2ampoeXhueGxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODc3MSwiZXhwIjoyMDY1OTU0NzcxfQ.9LZPJ0W6EKq_L_FJhP-0g4Qwl23zQdKIGIkNKm7lB2o"
      }
    }
  }
}
```

## Step 2: Restart Claude Code

After adding the configuration:
1. Save the settings file
2. Restart Claude Code completely
3. Start a new conversation

## Step 3: Verify MCP Tools Are Available

Once configured, I should have access to Supabase MCP tools like:
- `mcp__supabase__query` - Execute SQL queries
- `mcp__supabase__insert` - Insert data
- `mcp__supabase__update` - Update data  
- `mcp__supabase__delete` - Delete data
- `mcp__supabase__rpc` - Call stored functions
- `mcp__supabase__storage` - Manage storage

## Current Status

✅ Supabase MCP package installed globally
❌ Not yet configured in Claude Code settings
❌ MCP tools not yet available

## Next Steps

1. Add the MCP configuration to Claude Code settings
2. Restart Claude Code
3. Start a new conversation
4. Verify MCP tools are available
5. Use MCP tools to fix RLS policies and deploy functions

## Issues to Fix Once MCP is Available

1. **RLS Policy Recursion**: Use `mcp__supabase__query` to reset policies
2. **Function Deployment**: Use MCP to deploy messaging-system function
3. **Testing**: Verify messaging system works correctly