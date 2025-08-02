-- Fix Function Security Warnings (V2 - Handles Dependencies)
-- Update functions to use immutable search paths for enhanced security

-- ============================================================================
-- STEP 1: DROP DEPENDENT TRIGGERS FIRST
-- ============================================================================

-- Drop triggers that depend on functions we need to update
DROP TRIGGER IF EXISTS set_ticket_number ON public.support_tickets;
DROP TRIGGER IF EXISTS payment_status_notification ON public.payments;
DROP TRIGGER IF EXISTS dispute_status_notification ON public.disputes;

-- ============================================================================
-- STEP 2: UPDATE FUNCTIONS WITH SECURITY FIXES
-- ============================================================================

-- Fix get_user_role function
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

-- Fix is_property_landlord function
DROP FUNCTION IF EXISTS is_property_landlord(UUID, UUID);
CREATE OR REPLACE FUNCTION is_property_landlord(user_id UUID, property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.properties 
        WHERE id = property_id AND landlord_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_property_tenant function
DROP FUNCTION IF EXISTS is_property_tenant(UUID, UUID);
CREATE OR REPLACE FUNCTION is_property_tenant(user_id UUID, property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenancies t
        JOIN public.properties p ON p.id = t.property_id
        WHERE p.id = property_id AND t.tenant_id = user_id AND t.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_next_payment function (if it exists)
DROP FUNCTION IF EXISTS generate_next_payment(UUID);
CREATE OR REPLACE FUNCTION generate_next_payment(tenancy_id UUID)
RETURNS UUID AS $$
DECLARE
    new_payment_id UUID;
    tenancy_data RECORD;
    next_due_date DATE;
BEGIN
    -- Get tenancy information
    SELECT * INTO tenancy_data 
    FROM public.tenancies 
    WHERE id = tenancy_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active tenancy not found';
    END IF;
    
    -- Calculate next due date (first of next month)
    next_due_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
    
    -- Insert new payment record
    INSERT INTO public.payments (
        tenancy_id,
        amount,
        due_date,
        status
    ) VALUES (
        tenancy_id,
        tenancy_data.rent_amount,
        next_due_date,
        'pending'
    ) RETURNING id INTO new_payment_id;
    
    RETURN new_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_ticket_number function
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE; -- CASCADE to drop dependent objects
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    ticket_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current count of tickets today
    SELECT COUNT(*) INTO counter
    FROM public.support_tickets
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Generate ticket number: TNT-YYYYMMDD-#### format
    ticket_num := 'TNT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_payment_status_change function
DROP FUNCTION IF EXISTS notify_payment_status_change() CASCADE;
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
    
    -- Create notification record for tenant
    INSERT INTO public.notifications (
        user_id,
        title,
        content,
        type,
        priority,
        metadata
    )
    SELECT 
        t.tenant_id,
        CASE 
            WHEN NEW.status = 'paid' THEN 'Payment Confirmed'
            WHEN NEW.status = 'failed' THEN 'Payment Failed'
            WHEN NEW.status = 'late' THEN 'Payment Overdue'
            ELSE 'Payment Status Updated'
        END,
        CASE 
            WHEN NEW.status = 'paid' THEN 'Your payment has been successfully processed.'
            WHEN NEW.status = 'failed' THEN 'Your payment could not be processed. Please update your payment method.'
            WHEN NEW.status = 'late' THEN 'Your payment is now overdue. Please pay as soon as possible.'
            ELSE 'Your payment status has been updated to: ' || NEW.status
        END,
        'payment_received',
        CASE 
            WHEN NEW.status = 'failed' THEN 'high'
            WHEN NEW.status = 'late' THEN 'high'
            ELSE 'medium'
        END,
        json_build_object(
            'payment_id', NEW.id,
            'amount', NEW.amount,
            'old_status', OLD.status,
            'new_status', NEW.status
        )
    FROM public.tenancies t
    WHERE t.id = NEW.tenancy_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_dispute_status_change function
DROP FUNCTION IF EXISTS notify_dispute_status_change() CASCADE;
CREATE OR REPLACE FUNCTION notify_dispute_status_change()
RETURNS TRIGGER AS $$
DECLARE
    tenant_id UUID;
    landlord_id UUID;
BEGIN
    -- Get tenant and landlord IDs
    SELECT 
        t.tenant_id,
        p.landlord_id
    INTO tenant_id, landlord_id
    FROM public.tenancies t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = NEW.tenancy_id;
    
    -- Notify tenant (if they're not the one who made the change)
    IF tenant_id != NEW.resolved_by OR NEW.resolved_by IS NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            content,
            type,
            priority,
            action_url,
            metadata
        ) VALUES (
            tenant_id,
            'Dispute Status Updated',
            'Your dispute "' || NEW.title || '" status has been updated to: ' || NEW.status,
            'dispute_update',
            CASE WHEN NEW.status = 'resolved' THEN 'medium' ELSE 'high' END,
            '/disputes/' || NEW.id,
            json_build_object(
                'dispute_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    -- Notify landlord (if they're not the one who made the change)
    IF landlord_id != NEW.resolved_by OR NEW.resolved_by IS NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            content,
            type,
            priority,
            action_url,
            metadata
        ) VALUES (
            landlord_id,
            'Dispute Status Updated',
            'Dispute "' || NEW.title || '" status has been updated to: ' || NEW.status,
            'dispute_update',
            CASE WHEN NEW.status = 'resolved' THEN 'medium' ELSE 'high' END,
            '/disputes/' || NEW.id,
            json_build_object(
                'dispute_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_valid_email function
DROP FUNCTION IF EXISTS is_valid_email(TEXT);
CREATE OR REPLACE FUNCTION is_valid_email(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic email validation using regex
    RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_strong_password function
DROP FUNCTION IF EXISTS is_strong_password(TEXT);
CREATE OR REPLACE FUNCTION is_strong_password(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Password strength requirements:
    -- - At least 8 characters
    -- - Contains uppercase letter
    -- - Contains lowercase letter
    -- - Contains number
    -- - Contains special character
    RETURN (
        LENGTH(password) >= 8 AND
        password ~ '[A-Z]' AND
        password ~ '[a-z]' AND
        password ~ '[0-9]' AND
        password ~ '[^A-Za-z0-9]'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- STEP 3: CREATE ADDITIONAL SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin (secure version)
DROP FUNCTION IF EXISTS is_admin(UUID);
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's organization (secure version)
DROP FUNCTION IF EXISTS get_user_organization(UUID);
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id FROM public.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check tenancy association (secure version)
DROP FUNCTION IF EXISTS is_associated_with_tenancy(UUID);
CREATE OR REPLACE FUNCTION is_associated_with_tenancy(tenancy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenancies t
        LEFT JOIN public.properties p ON p.id = t.property_id
        WHERE t.id = tenancy_id 
        AND (t.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check household membership
DROP FUNCTION IF EXISTS is_household_member(UUID);
CREATE OR REPLACE FUNCTION is_household_member(tenancy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.household_members hm
        WHERE hm.tenancy_id = tenancy_id 
        AND hm.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can access maintenance request
DROP FUNCTION IF EXISTS can_access_maintenance_request(UUID);
CREATE OR REPLACE FUNCTION can_access_maintenance_request(request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.tenancies t ON t.id = mr.tenancy_id
        LEFT JOIN public.properties p ON p.id = t.property_id
        WHERE mr.id = request_id
        AND (
            t.tenant_id = auth.uid() OR 
            p.landlord_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.household_members hm 
                WHERE hm.tenancy_id = t.id AND hm.user_id = auth.uid()
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check organization membership
DROP FUNCTION IF EXISTS is_member_of_organization(UUID);
CREATE OR REPLACE FUNCTION is_member_of_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- STEP 4: RECREATE TRIGGERS THAT WERE DROPPED
-- ============================================================================

-- Recreate ticket number trigger
CREATE TRIGGER set_ticket_number 
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW 
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Recreate payment status notification trigger
CREATE TRIGGER payment_status_notification 
    AFTER UPDATE OF status ON public.payments
    FOR EACH ROW 
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_payment_status_change();

-- Recreate dispute status notification trigger
CREATE TRIGGER dispute_status_notification 
    AFTER UPDATE OF status ON public.disputes
    FOR EACH ROW 
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_dispute_status_change();

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================================

-- Count updated functions (should be 15+)
SELECT COUNT(*) as functions_updated FROM (
    SELECT proname
    FROM pg_proc 
    WHERE pronamespace = 'public'::regnamespace 
        AND prosecdef = true
        AND proconfig IS NOT NULL
        AND 'search_path=public' = ANY(proconfig)
        AND proname IN (
            'get_user_role', 'is_property_landlord', 'is_property_tenant',
            'generate_next_payment', 'generate_ticket_number', 
            'notify_payment_status_change', 'notify_dispute_status_change',
            'is_valid_email', 'is_strong_password', 'is_admin',
            'get_user_organization', 'is_associated_with_tenancy',
            'is_household_member', 'can_access_maintenance_request',
            'is_member_of_organization'
        )
) as secure_functions;

-- List all secured functions
SELECT 
    'Function "' || proname || '" has been secured with search_path=public' as status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
    AND prosecdef = true
    AND proconfig IS NOT NULL
    AND 'search_path=public' = ANY(proconfig)
ORDER BY proname;

-- Verify triggers were recreated
SELECT 
    'Trigger "' || tgname || '" on table "' || relname || '" is active' as trigger_status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname IN ('set_ticket_number', 'payment_status_notification', 'dispute_status_notification')
ORDER BY tgname;