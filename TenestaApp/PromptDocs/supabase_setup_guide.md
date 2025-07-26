# Tenesta - Supabase Setup & MCP Integration Guide

## 🚀 Step 1: Create Supabase Project

### 1.1 Sign up and Create Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. **Project Details:**
   - **Name:** `tenesta-production` (or `tenesta-dev` for development)
   - **Database Password:** Generate a strong password and save it securely
   - **Region:** Choose closest to your target users (US East/West)
   - **Pricing Plan:** Start with Free tier

### 1.2 Save Your Project Credentials
Once created, go to **Settings → API** and copy these values:
```env
# Save these for later
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
PROJECT_REF=your-project-ref (from the URL)
```

### 1.3 Create Personal Access Token
1. Go to **Account Settings** (click your avatar)
2. Navigate to **Access Tokens**
3. Click **Generate New Token**
4. **Name:** `Tenesta MCP Integration`
5. **Scope:** Select all permissions needed
6. Copy the token immediately (you won't see it again!)
```env
SUPABASE_ACCESS_TOKEN=sbp_your-personal-access-token
```

## 🔌 Step 2: Set Up MCP Integration

### 2.1 For Cursor (Recommended)
1. Open Cursor
2. Create or navigate to your project folder
3. Create `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF_HERE"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

4. Replace `YOUR_PROJECT_REF_HERE` with your actual project ref
5. Replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your personal access token
6. Save the file
7. Restart Cursor
8. Go to **Settings → MCP** - you should see a green status indicator

### 2.2 For Claude Desktop (Alternative)
1. Open Claude Desktop
2. Go to **Settings → Developer → Edit Config**
3. Add this configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF_HERE"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

4. Save and restart Claude Desktop

### 2.3 Test MCP Connection
In Cursor or Claude, try asking:
```
"Can you list my Supabase projects and show me the current database schema?"
```

If working correctly, you should see your project information and any existing tables.

## 🗄️ Step 3: Create Tenesta Database Schema

### 3.1 Enable Required Extensions
First, let's enable necessary PostgreSQL extensions:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security helper functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable full-text search (for document search later)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 3.2 Create Core Tables

#### Organizations (Property Management Companies)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('individual', 'small_business', 'enterprise')) DEFAULT 'individual',
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'landlord', 'landlord_pro', 'enterprise')) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Users (Tenants, Landlords, Staff)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('tenant', 'landlord', 'admin', 'staff', 'maintenance')) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    profile JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization_id);
```

#### Properties
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    rent_amount DECIMAL(10,2),
    security_deposit DECIMAL(10,2),
    lease_start DATE,
    lease_end DATE,
    property_details JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('available', 'occupied', 'maintenance', 'unavailable')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_organization ON properties(organization_id);
```

#### Tenancies (Tenant-Property Relationships)
```sql
CREATE TABLE tenancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    rent_amount DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2),
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'pending', 'expired', 'terminated')) DEFAULT 'pending',
    lease_terms JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active tenancy per property
    UNIQUE(property_id, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_tenancies_tenant ON tenancies(tenant_id);
CREATE INDEX idx_tenancies_property ON tenancies(property_id);
CREATE INDEX idx_tenancies_status ON tenancies(status);
```

#### Payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('pending', 'paid', 'partial', 'late', 'failed')) DEFAULT 'pending',
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    notes TEXT,
    late_fees DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_tenancy ON payments(tenancy_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
```

#### Documents
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    document_type TEXT CHECK (document_type IN ('lease', 'receipt', 'violation_evidence', 'maintenance_request', 'other')) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    ai_analysis JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_tenancy ON documents(tenancy_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploader ON documents(uploader_id);
```

#### Disputes & Issues
```sql
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('maintenance', 'payment', 'lease_violation', 'noise', 'damage', 'other')) NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disputes_tenancy ON disputes(tenancy_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_category ON disputes(category);
CREATE INDEX idx_disputes_priority ON disputes(priority);
```

#### Messages (AI-Enhanced Communication)
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT,
    content TEXT NOT NULL,
    ai_suggestions JSONB DEFAULT '{}',
    message_type TEXT CHECK (message_type IN ('rent_reminder', 'maintenance_request', 'general', 'dispute', 'system')) DEFAULT 'general',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_tenancy ON messages(tenancy_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_type ON messages(message_type);
```

#### Notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('payment_due', 'payment_received', 'lease_expiring', 'dispute_update', 'system', 'ai_insight')) NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read_at);
```

### 3.3 Set Up Row Level Security (RLS)

#### Enable RLS on all tables
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

#### Create Security Policies

**Users can see their own data:**
```sql
CREATE POLICY "Users can view own profile" ON users
    FOR ALL USING (auth.uid() = id);
```

**Tenants can see their tenancy data:**
```sql
CREATE POLICY "Tenants can view own tenancies" ON tenancies
    FOR ALL USING (tenant_id = auth.uid());
```

**Landlords can see their properties and related data:**
```sql
CREATE POLICY "Landlords can view own properties" ON properties
    FOR ALL USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can view tenancies for their properties" ON tenancies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = tenancies.property_id 
            AND p.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Landlords can view payments for their properties" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tenancies t
            JOIN properties p ON p.id = t.property_id
            WHERE t.id = payments.tenancy_id 
            AND p.landlord_id = auth.uid()
        )
    );
```

**Organization-level access for enterprise users:**
```sql
CREATE POLICY "Organization members can view org data" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );
```

### 3.4 Create Database Functions

#### Function to automatically update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenancies_updated_at BEFORE UPDATE ON tenancies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Function to send real-time notifications
```sql
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Send real-time notification when payment status changes
    PERFORM pg_notify(
        'payment_status_changed',
        json_build_object(
            'payment_id', NEW.id,
            'tenancy_id', NEW.tenancy_id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'amount', NEW.amount
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_status_notification 
    AFTER UPDATE OF status ON payments
    FOR EACH ROW 
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_payment_status_change();
```

## 🔐 Step 4: Configure Authentication

### 4.1 Set Up Auth Policies
Go to **Authentication → Policies** in Supabase dashboard and configure:

1. **Enable email confirmation** (recommended for production)
2. **Set up social providers** if needed (Google, Apple)
3. **Configure JWT settings** for your app

### 4.2 Create Custom Claims Function
```sql
CREATE OR REPLACE FUNCTION auth.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📁 Step 5: Set Up Storage

### 5.1 Create Storage Buckets
In Supabase dashboard, go to **Storage** and create these buckets:

1. **documents** (for leases, receipts, etc.)
2. **photos** (for property/damage photos)
3. **avatars** (for user profile pictures)

### 5.2 Configure Storage Policies
```sql
-- Allow users to upload documents for their tenancies
CREATE POLICY "Users can upload tenancy documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view documents they have access to
CREATE POLICY "Users can view accessible documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 🧪 Step 6: Test Your Setup

### 6.1 Using MCP in Cursor/Claude
Try these commands to test your setup:

```
"Show me all tables in my Tenesta database"
"Create a sample landlord user in the users table"
"Show me the properties table structure"
"Generate TypeScript types for all my tables"
```

### 6.2 Test Data Insertion
```sql
-- Insert test organization
INSERT INTO organizations (name, type, subscription_tier) 
VALUES ('Test Property Management', 'small_business', 'landlord_pro');

-- Insert test landlord
INSERT INTO users (email, role, organization_id) 
VALUES ('landlord@test.com', 'landlord', (SELECT id FROM organizations LIMIT 1));

-- Insert test property
INSERT INTO properties (address, city, state, zip_code, landlord_id, rent_amount, security_deposit)
VALUES ('123 Main St', 'New York', 'NY', '10001', (SELECT id FROM users WHERE role = 'landlord' LIMIT 1), 2500.00, 5000.00);
```

### 6.3 Test Real-time Subscriptions
In your frontend (when you build it), you can test:
```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

supabase
  .channel('payment-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'payments'
  }, (payload) => {
    console.log('Payment updated:', payload);
  })
  .subscribe();
```

## 🚀 Next Steps

1. **Verify MCP Connection**: Make sure you can query your database through AI
2. **Test RLS Policies**: Ensure data isolation works correctly
3. **Set up your React Native app** with Supabase client
4. **Configure Stripe webhooks** to update payment status
5. **Add AI Edge Functions** for document analysis

You now have a fully configured Supabase database with MCP integration! Your AI assistant can help you manage schema changes, test queries, and debug issues directly through conversation.

## 🐛 Troubleshooting

### MCP Connection Issues
- Ensure Node.js is installed (`node --version`)
- Check that your access token has proper permissions
- Verify project ref is correct (no extra characters)
- Restart Cursor/Claude after configuration changes

### Database Access Issues
- Check RLS policies if you can't see data
- Verify user authentication is working
- Ensure you're using the correct API keys

### Need Help?
Use your MCP connection to ask:
- "Debug my RLS policies for the payments table"
- "Show me why I can't insert data into properties"
- "Generate a sample query to test my tenancy relationships"