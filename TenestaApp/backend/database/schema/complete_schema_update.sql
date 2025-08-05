-- ============================================================================
-- COMPLETE SCHEMA UPDATE - ENSURE ALL TABLES HAVE CORRECT STRUCTURE
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('individual', 'small_business', 'enterprise')) DEFAULT 'individual',
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'landlord', 'landlord_pro', 'enterprise')) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to organizations if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'settings') THEN
        ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_tier') THEN
        ALTER TABLE organizations ADD COLUMN subscription_tier TEXT CHECK (subscription_tier IN ('free', 'landlord', 'landlord_pro', 'enterprise')) DEFAULT 'free';
    END IF;
END $$;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('tenant', 'landlord', 'admin', 'staff', 'maintenance')) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    profile JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to users if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
        ALTER TABLE users ADD COLUMN auth_user_id UUID UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile') THEN
        ALTER TABLE users ADD COLUMN profile JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') THEN
        ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active') THEN
        ALTER TABLE users ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
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

-- ============================================================================
-- TENANCIES TABLE - CRITICAL FIX
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenancies (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to tenancies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenancies' AND column_name = 'status') THEN
        ALTER TABLE tenancies ADD COLUMN status TEXT CHECK (status IN ('active', 'pending', 'expired', 'terminated')) DEFAULT 'pending';
        RAISE NOTICE 'Added status column to tenancies';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenancies' AND column_name = 'lease_terms') THEN
        ALTER TABLE tenancies ADD COLUMN lease_terms JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenancies' AND column_name = 'created_at') THEN
        ALTER TABLE tenancies ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenancies' AND column_name = 'updated_at') THEN
        ALTER TABLE tenancies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
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

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type TEXT CHECK (document_type IN ('lease', 'receipt', 'notice', 'maintenance', 'other')) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing auth_user_id field fix for documents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'auth_user_id') THEN
        ALTER TABLE documents ADD COLUMN auth_user_id UUID;
        -- Update existing records to populate auth_user_id from uploader_id
        UPDATE documents SET auth_user_id = (
            SELECT auth_user_id FROM users WHERE users.id = documents.uploader_id
        ) WHERE auth_user_id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- DISPUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('maintenance', 'noise', 'payment', 'lease_violation', 'other')) NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type TEXT CHECK (message_type IN ('rent_reminder', 'maintenance_request', 'general', 'dispute', 'system')) DEFAULT 'general',
    subject TEXT,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('payment_reminder', 'maintenance_update', 'dispute_update', 'system', 'lease_expiring')) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NEW TABLES FOR HOUSEHOLD MANAGEMENT
-- ============================================================================

-- Household Members Table
CREATE TABLE IF NOT EXISTS household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('primary', 'member', 'guest')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('active', 'pending', 'removed')) DEFAULT 'pending',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenancy_id, user_id)
);

-- Shared Tasks Table
CREATE TABLE IF NOT EXISTS shared_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    task_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Split Payments Table
CREATE TABLE IF NOT EXISTS split_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    household_member_id UUID REFERENCES household_members(id) ON DELETE CASCADE,
    split_amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    status TEXT CHECK (status IN ('pending', 'paid', 'partial', 'failed')) DEFAULT 'pending',
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    split_amounts JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT split_amount_positive CHECK (split_amount > 0),
    CONSTRAINT percentage_valid CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

-- ============================================================================
-- ADD ALL NECESSARY INDEXES
-- ============================================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_organization ON properties(organization_id);

CREATE INDEX IF NOT EXISTS idx_tenancies_tenant ON tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_property ON tenancies(property_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_status ON tenancies(status);

CREATE INDEX IF NOT EXISTS idx_payments_tenancy ON payments(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- New table indexes
CREATE INDEX IF NOT EXISTS idx_household_members_tenancy ON household_members(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_status ON household_members(status);

CREATE INDEX IF NOT EXISTS idx_shared_tasks_tenancy ON shared_tasks(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_assigned ON shared_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_status ON shared_tasks(status);

CREATE INDEX IF NOT EXISTS idx_split_payments_payment ON split_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_split_payments_member ON split_payments(household_member_id);
CREATE INDEX IF NOT EXISTS idx_split_payments_status ON split_payments(status);

-- ============================================================================
-- ADD CONSTRAINTS SAFELY
-- ============================================================================

-- Add unique constraint for tenancies if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenancies_property_status_unique'
        AND table_name = 'tenancies'
    ) THEN
        -- Only add constraint if there are no conflicts
        IF NOT EXISTS (
            SELECT property_id, status, COUNT(*)
            FROM tenancies 
            WHERE status = 'active'
            GROUP BY property_id, status
            HAVING COUNT(*) > 1
        ) THEN
            ALTER TABLE tenancies 
            ADD CONSTRAINT tenancies_property_status_unique 
            UNIQUE(property_id, status) DEFERRABLE INITIALLY DEFERRED;
            RAISE NOTICE 'Added unique constraint to tenancies';
        ELSE
            RAISE NOTICE 'Cannot add unique constraint - conflicts exist in data';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- CREATE UPDATE TRIGGERS
-- ============================================================================

-- Create update function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenancies_updated_at ON tenancies;
CREATE TRIGGER update_tenancies_updated_at BEFORE UPDATE ON tenancies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_household_members_updated_at ON household_members;
CREATE TRIGGER update_household_members_updated_at BEFORE UPDATE ON household_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_tasks_updated_at ON shared_tasks;
CREATE TRIGGER update_shared_tasks_updated_at BEFORE UPDATE ON shared_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_split_payments_updated_at ON split_payments;
CREATE TRIGGER update_split_payments_updated_at BEFORE UPDATE ON split_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- List all tables and their column counts
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- Show the tenancies table structure specifically
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenancies' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ Schema update complete! All tables should now have correct structure.' as status;