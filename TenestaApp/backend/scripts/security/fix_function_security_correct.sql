-- Fix Function Security - Correct Parameter Names Version
-- This version uses the exact parameter names from your existing functions

-- ============================================================================
-- UPDATE FUNCTIONS WITH SECURITY FIXES (MATCHING EXACT SIGNATURES)
-- ============================================================================

-- Fix get_user_role function (parameter: user_uuid)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE id = user_uuid OR auth_user_id = user_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_property_landlord function (parameters: user_uuid, property_uuid)
CREATE OR REPLACE FUNCTION is_property_landlord(user_uuid UUID, property_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM properties p
        JOIN users u ON p.landlord_id = u.id
        WHERE p.id = property_uuid 
        AND (u.id = user_uuid OR u.auth_user_id = user_uuid)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_property_tenant function (parameters: user_uuid, property_uuid)
CREATE OR REPLACE FUNCTION is_property_tenant(user_uuid UUID, property_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenancies t
        JOIN users u ON t.tenant_id = u.id
        WHERE t.property_id = property_uuid 
        AND t.status = 'active'
        AND (u.id = user_uuid OR u.auth_user_id = user_uuid)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_next_payment function (parameter: tenancy_uuid)
-- Note: This returns a TABLE, not just UUID
CREATE OR REPLACE FUNCTION generate_next_payment(tenancy_uuid UUID)
RETURNS TABLE(due_date date, period_start date, period_end date, amount numeric) AS $$
DECLARE
    last_payment_end DATE;
    tenancy_record RECORD;
BEGIN
    -- Get tenancy details
    SELECT * INTO tenancy_record FROM tenancies WHERE id = tenancy_uuid;
    
    -- Get last payment period end
    SELECT payment_period_end INTO last_payment_end
    FROM payments 
    WHERE tenancy_id = tenancy_uuid 
    ORDER BY payment_period_end DESC 
    LIMIT 1;
    
    -- If no previous payments, start from lease start
    IF last_payment_end IS NULL THEN
        last_payment_end := tenancy_record.lease_start - INTERVAL '1 day';
    END IF;
    
    -- Calculate next period
    period_start := last_payment_end + INTERVAL '1 day';
    period_end := period_start + INTERVAL '1 month' - INTERVAL '1 day';
    due_date := period_start;
    amount := tenancy_record.rent_amount;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_ticket_number function (trigger function - no parameters)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('ticket_number_seq')::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_payment_status_change function (trigger function - no parameters)
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
            'amount', NEW.amount,
            'due_date', NEW.due_date
        )::text
    );
    
    -- Auto-create notification record for relevant users
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        INSERT INTO notifications (user_id, title, content, type, priority)
        SELECT 
            u.id,
            'Payment Received',
            'Rent payment of $' || NEW.amount || ' has been received.',
            'payment_received',
            'medium'
        FROM tenancies t
        JOIN properties p ON t.property_id = p.id
        JOIN users u ON p.landlord_id = u.id
        WHERE t.id = NEW.tenancy_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_dispute_status_change function (trigger function - no parameters)
CREATE OR REPLACE FUNCTION notify_dispute_status_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'dispute_status_changed',
        json_build_object(
            'dispute_id', NEW.id,
            'tenancy_id', NEW.tenancy_id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'title', NEW.title,
            'priority', NEW.priority
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_valid_email function (parameter: email)
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- Fix is_strong_password function (parameter: password)
-- Note: This returns JSONB with detailed info, not just BOOLEAN
CREATE OR REPLACE FUNCTION is_strong_password(password TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  score INTEGER := 0;
  feedback TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check length
  IF length(password) >= 8 THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase
  IF password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Include at least one uppercase letter');
  END IF;
  
  -- Check for lowercase
  IF password ~ '[a-z]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Include at least one lowercase letter');
  END IF;
  
  -- Check for numbers
  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Include at least one number');
  END IF;
  
  -- Check for special characters
  IF password ~ '[!@#$%^&*(),.?":{}|<>]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Include at least one special character');
  END IF;
  
  result := jsonb_build_object(
    'score', score,
    'max_score', 5,
    'is_valid', score >= 4,
    'strength', CASE 
      WHEN score <= 2 THEN 'weak'
      WHEN score = 3 THEN 'fair'
      WHEN score = 4 THEN 'good'
      ELSE 'strong'
    END,
    'feedback', to_jsonb(feedback)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- Note: These functions already have correct security settings in your database:
-- is_admin, get_user_organization, is_associated_with_tenancy, is_member_of_organization
-- They already have SECURITY DEFINER and SET search_path = public

-- ============================================================================
-- ADDITIONAL SECURITY FUNCTIONS (if they don't exist)
-- ============================================================================

-- Create is_household_member if it doesn't exist
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

-- Create can_access_maintenance_request if it doesn't exist
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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which functions now have proper security settings
SELECT 
    proname as "Function Name",
    CASE 
        WHEN prosecdef = true THEN '✅ SECURITY DEFINER'
        ELSE '❌ Not SECURITY DEFINER'
    END as "Security Setting",
    CASE 
        WHEN proconfig IS NULL THEN '❌ No search_path set'
        WHEN 'search_path=public' = ANY(proconfig) THEN '✅ search_path=public'
        ELSE '⚠️  Different search_path: ' || array_to_string(proconfig, ', ')
    END as "Search Path Status"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_user_role',
    'is_property_landlord',
    'is_property_tenant',
    'generate_next_payment',
    'generate_ticket_number',
    'notify_payment_status_change',
    'notify_dispute_status_change',
    'is_valid_email',
    'is_strong_password',
    'is_admin',
    'get_user_organization',
    'is_associated_with_tenancy',
    'is_member_of_organization',
    'is_household_member',
    'can_access_maintenance_request'
)
ORDER BY proname;

-- Summary
SELECT 
    COUNT(*) FILTER (WHERE prosecdef = true AND 'search_path=public' = ANY(proconfig)) as "✅ Fully Secured",
    COUNT(*) FILTER (WHERE prosecdef = true AND (proconfig IS NULL OR NOT 'search_path=public' = ANY(proconfig))) as "⚠️  SECURITY DEFINER only",
    COUNT(*) FILTER (WHERE NOT prosecdef) as "❌ Not Secured",
    COUNT(*) as "Total Functions"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_user_role', 'is_property_landlord', 'is_property_tenant',
    'generate_next_payment', 'generate_ticket_number', 
    'notify_payment_status_change', 'notify_dispute_status_change',
    'is_valid_email', 'is_strong_password', 'is_admin',
    'get_user_organization', 'is_associated_with_tenancy',
    'is_member_of_organization', 'is_household_member',
    'can_access_maintenance_request'
);