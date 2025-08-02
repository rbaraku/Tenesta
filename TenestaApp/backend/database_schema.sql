-- Tenesta Database Schema
-- Based on PRD requirements and setup documentation

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security helper functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable full-text search (for document search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations (Property Management Companies)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('individual', 'small_business', 'enterprise')) DEFAULT 'individual',
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'landlord', 'landlord_pro', 'enterprise')) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (Tenants, Landlords, Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Links to auth.users.id in Supabase Auth
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('tenant', 'landlord', 'admin', 'staff', 'maintenance')) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    profile JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties
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

-- Tenancies (Tenant-Property Relationships)
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

-- Payments
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

-- Documents
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

-- Disputes & Issues
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

-- Messages (AI-Enhanced Communication)
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

-- Notifications
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

-- Notes (Private user notes)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Properties indexes
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_organization ON properties(organization_id);

-- Tenancies indexes
CREATE INDEX idx_tenancies_tenant ON tenancies(tenant_id);
CREATE INDEX idx_tenancies_property ON tenancies(property_id);
CREATE INDEX idx_tenancies_status ON tenancies(status);

-- Payments indexes
CREATE INDEX idx_payments_tenancy ON payments(tenancy_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Documents indexes
CREATE INDEX idx_documents_tenancy ON documents(tenancy_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploader ON documents(uploader_id);

-- Disputes indexes
CREATE INDEX idx_disputes_tenancy ON disputes(tenancy_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_category ON disputes(category);
CREATE INDEX idx_disputes_priority ON disputes(priority);

-- Messages indexes
CREATE INDEX idx_messages_tenancy ON messages(tenancy_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_type ON messages(message_type);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- Notes indexes
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_tenancy ON notes(tenancy_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id FROM users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user is landlord of property
CREATE OR REPLACE FUNCTION is_property_landlord(user_id UUID, property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM properties 
        WHERE id = property_id AND landlord_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user is tenant of property
CREATE OR REPLACE FUNCTION is_property_tenant(user_id UUID, property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenancies t
        JOIN properties p ON p.id = t.property_id
        WHERE p.id = property_id AND t.tenant_id = user_id AND t.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check tenancy association
CREATE OR REPLACE FUNCTION is_associated_with_tenancy(tenancy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenancies t
        LEFT JOIN properties p ON p.id = t.property_id
        WHERE t.id = tenancy_id 
        AND (t.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to automatically update timestamps
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

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to send real-time notifications
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view organization members" ON users
    FOR SELECT USING (
        organization_id = get_user_organization(auth.uid())
    );

-- Properties policies
CREATE POLICY "Landlords can manage own properties" ON properties
    FOR ALL USING (landlord_id = auth.uid());

CREATE POLICY "Tenants can view their properties" ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenancies t 
            WHERE t.property_id = properties.id 
            AND t.tenant_id = auth.uid() 
            AND t.status = 'active'
        )
    );

-- Tenancies policies
CREATE POLICY "Tenants can view own tenancies" ON tenancies
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Landlords can manage tenancies for their properties" ON tenancies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = tenancies.property_id 
            AND p.landlord_id = auth.uid()
        )
    );

-- Payments policies
CREATE POLICY "Users can view their payment data" ON payments
    FOR SELECT USING (is_associated_with_tenancy(tenancy_id));

CREATE POLICY "System can manage payments" ON payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true);

-- Documents policies
CREATE POLICY "Users can manage documents they uploaded" ON documents
    FOR ALL USING (uploader_id = auth.uid());

CREATE POLICY "Users can view tenancy documents" ON documents
    FOR SELECT USING (is_associated_with_tenancy(tenancy_id));

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
    FOR ALL USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Disputes policies
CREATE POLICY "Users can manage their disputes" ON disputes
    FOR ALL USING (
        reporter_id = auth.uid() OR is_associated_with_tenancy(tenancy_id)
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- Notes policies (completely private)
CREATE POLICY "Users can manage own notes" ON notes
    FOR ALL USING (user_id = auth.uid());

-- Organization policies
CREATE POLICY "Organization members can view org data" ON organizations
    FOR SELECT USING (
        id = get_user_organization(auth.uid())
    );

-- ============================================================================
-- SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Insert test organization
-- INSERT INTO organizations (name, type, subscription_tier) 
-- VALUES ('Test Property Management', 'small_business', 'landlord_pro');

-- Insert test landlord
-- INSERT INTO users (email, role, organization_id) 
-- VALUES ('landlord@test.com', 'landlord', (SELECT id FROM organizations LIMIT 1));

-- Insert test property
-- INSERT INTO properties (address, city, state, zip_code, landlord_id, rent_amount, security_deposit)
-- VALUES ('123 Main St', 'New York', 'NY', '10001', (SELECT id FROM users WHERE role = 'landlord' LIMIT 1), 2500.00, 5000.00);