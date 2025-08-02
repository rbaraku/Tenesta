-- Set up Supabase Storage for Document Management
-- Run this in Supabase SQL Editor

-- Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents', 
    'documents', 
    false, -- Private bucket
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage bucket
CREATE POLICY "Users can upload documents for their tenancies" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (
        -- Tenant can upload to their own tenancy
        EXISTS (
            SELECT 1 FROM tenancies t 
            WHERE t.id = (split_part(name, '/', 2))::uuid
            AND t.tenant_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
        OR
        -- Landlord can upload to properties they own
        EXISTS (
            SELECT 1 FROM tenancies t
            JOIN properties p ON t.property_id = p.id
            WHERE t.id = (split_part(name, '/', 2))::uuid
            AND p.landlord_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
        OR
        -- Admin/staff can upload anywhere in their organization
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role IN ('admin', 'staff')
        )
    )
);

CREATE POLICY "Users can view documents for their tenancies" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' AND 
    (
        -- Tenant can view their own tenancy documents
        EXISTS (
            SELECT 1 FROM tenancies t 
            WHERE t.id = (split_part(name, '/', 2))::uuid
            AND t.tenant_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
        OR
        -- Landlord can view documents for properties they own
        EXISTS (
            SELECT 1 FROM tenancies t
            JOIN properties p ON t.property_id = p.id
            WHERE t.id = (split_part(name, '/', 2))::uuid
            AND p.landlord_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
        OR
        -- Admin/staff can view anything in their organization
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role IN ('admin', 'staff')
        )
    )
);

CREATE POLICY "Users can delete documents they uploaded" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' AND 
    (
        -- Users can delete documents they uploaded
        owner = auth.uid()
        OR
        -- Landlords can delete documents from their properties
        EXISTS (
            SELECT 1 FROM tenancies t
            JOIN properties p ON t.property_id = p.id
            WHERE t.id = (split_part(name, '/', 2))::uuid
            AND p.landlord_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
        OR
        -- Admins can delete anything in their organization
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role = 'admin'
        )
    )
);

-- Verify bucket creation
SELECT * FROM storage.buckets WHERE id = 'documents';