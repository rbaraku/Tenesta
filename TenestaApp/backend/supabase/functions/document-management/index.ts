// Tenesta - Document Management API
// Handles file uploads, downloads, and document organization

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface DocumentUploadRequest {
  action: 'upload' | 'download' | 'list' | 'delete' | 'update_metadata'
  tenancy_id?: string
  document_type?: 'lease' | 'receipt' | 'violation_evidence' | 'maintenance_request' | 'other'
  file_name?: string
  file_data?: string // Base64 encoded file data
  mime_type?: string
  metadata?: Record<string, any>
  document_id?: string
  folder?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Get user profile for role checking
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const requestData: DocumentUploadRequest = await req.json()
    const { action } = requestData

    switch (action) {
      case 'upload':
        return await handleUpload(supabaseClient, userProfile, requestData)
      
      case 'download':
        return await handleDownload(supabaseClient, userProfile, requestData)
      
      case 'list':
        return await handleList(supabaseClient, userProfile, requestData)
      
      case 'delete':
        return await handleDelete(supabaseClient, userProfile, requestData)
      
      case 'update_metadata':
        return await handleUpdateMetadata(supabaseClient, userProfile, requestData)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }

  } catch (error) {
    console.error('Error in document-management function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function handleUpload(supabaseClient: any, userProfile: any, requestData: DocumentUploadRequest) {
  const { tenancy_id, document_type, file_name, file_data, mime_type, metadata } = requestData

  if (!tenancy_id || !document_type || !file_name || !file_data || !mime_type) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: tenancy_id, document_type, file_name, file_data, mime_type' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Verify user has access to this tenancy
  const hasAccess = await verifyTenancyAccess(supabaseClient, userProfile, tenancy_id)
  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Access denied to this tenancy' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  try {
    // Convert base64 to bytes
    const fileData = Uint8Array.from(atob(file_data), c => c.charCodeAt(0))
    
    // Generate unique file path
    const fileExtension = getFileExtension(file_name)
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`
    const filePath = `documents/${tenancy_id}/${document_type}/${uniqueFileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, fileData, {
        contentType: mime_type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Save document metadata to database
    const { data: documentData, error: documentError } = await supabaseClient
      .from('documents')
      .insert({
        tenancy_id,
        uploader_id: userProfile.id,
        document_type,
        file_name,
        file_path: filePath,
        file_size: fileData.length,
        mime_type,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (documentError) {
      console.error('Database insert error:', documentError)
      // Clean up uploaded file
      await supabaseClient.storage.from('documents').remove([filePath])
      
      return new Response(
        JSON.stringify({ error: 'Failed to save document metadata' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        document: documentData,
        message: 'Document uploaded successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process file upload' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleDownload(supabaseClient: any, userProfile: any, requestData: DocumentUploadRequest) {
  const { document_id } = requestData

  if (!document_id) {
    return new Response(
      JSON.stringify({ error: 'Missing document_id' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Get document metadata
  const { data: document, error: docError } = await supabaseClient
    .from('documents')
    .select('*')
    .eq('id', document_id)
    .single()

  if (docError || !document) {
    return new Response(
      JSON.stringify({ error: 'Document not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    )
  }

  // Verify user has access to this tenancy
  const hasAccess = await verifyTenancyAccess(supabaseClient, userProfile, document.tenancy_id)
  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Access denied to this document' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  // Get signed URL for download
  const { data: signedUrlData, error: urlError } = await supabaseClient.storage
    .from('documents')
    .createSignedUrl(document.file_path, 3600) // 1 hour expiry

  if (urlError) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate download URL' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      document: document,
      download_url: signedUrlData.signedUrl,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleList(supabaseClient: any, userProfile: any, requestData: DocumentUploadRequest) {
  const { tenancy_id, document_type } = requestData

  if (!tenancy_id) {
    return new Response(
      JSON.stringify({ error: 'Missing tenancy_id' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Verify user has access to this tenancy
  const hasAccess = await verifyTenancyAccess(supabaseClient, userProfile, tenancy_id)
  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Access denied to this tenancy' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  // Build query
  let query = supabaseClient
    .from('documents')
    .select(`
      *,
      uploader:users!documents_uploader_id_fkey (
        id,
        profile
      )
    `)
    .eq('tenancy_id', tenancy_id)
    .order('created_at', { ascending: false })

  // Filter by document type if specified
  if (document_type) {
    query = query.eq('document_type', document_type)
  }

  const { data: documents, error: docsError } = await query

  if (docsError) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch documents' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      documents: documents || [],
      count: documents?.length || 0
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleDelete(supabaseClient: any, userProfile: any, requestData: DocumentUploadRequest) {
  const { document_id } = requestData

  if (!document_id) {
    return new Response(
      JSON.stringify({ error: 'Missing document_id' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Get document metadata
  const { data: document, error: docError } = await supabaseClient
    .from('documents')
    .select('*')
    .eq('id', document_id)
    .single()

  if (docError || !document) {
    return new Response(
      JSON.stringify({ error: 'Document not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    )
  }

  // Verify user has access and permission to delete
  const hasAccess = await verifyTenancyAccess(supabaseClient, userProfile, document.tenancy_id)
  const canDelete = hasAccess && (
    userProfile.role === 'admin' || 
    userProfile.role === 'landlord' || 
    document.uploader_id === userProfile.id
  )

  if (!canDelete) {
    return new Response(
      JSON.stringify({ error: 'Access denied. Cannot delete this document.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  // Delete from storage
  const { error: storageError } = await supabaseClient.storage
    .from('documents')
    .remove([document.file_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  // Delete from database
  const { error: dbError } = await supabaseClient
    .from('documents')
    .delete()
    .eq('id', document_id)

  if (dbError) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete document record' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Document deleted successfully'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleUpdateMetadata(supabaseClient: any, userProfile: any, requestData: DocumentUploadRequest) {
  const { document_id, metadata } = requestData

  if (!document_id || !metadata) {
    return new Response(
      JSON.stringify({ error: 'Missing document_id or metadata' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Get document metadata
  const { data: document, error: docError } = await supabaseClient
    .from('documents')
    .select('*')
    .eq('id', document_id)
    .single()

  if (docError || !document) {
    return new Response(
      JSON.stringify({ error: 'Document not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    )
  }

  // Verify user has access
  const hasAccess = await verifyTenancyAccess(supabaseClient, userProfile, document.tenancy_id)
  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Access denied to this document' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  // Update metadata
  const { data: updatedDocument, error: updateError } = await supabaseClient
    .from('documents')
    .update({ 
      metadata: { ...document.metadata, ...metadata },
      updated_at: new Date().toISOString()
    })
    .eq('id', document_id)
    .select()
    .single()

  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Failed to update document metadata' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      document: updatedDocument,
      message: 'Document metadata updated successfully'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

// Helper function to verify user has access to tenancy
async function verifyTenancyAccess(supabaseClient: any, userProfile: any, tenancy_id: string) {
  if (userProfile.role === 'admin') {
    return true // Admins have access to everything
  }

  const { data: tenancy, error } = await supabaseClient
    .from('tenancies')
    .select(`
      *,
      property:properties (
        landlord_id,
        organization_id
      )
    `)
    .eq('id', tenancy_id)
    .single()

  if (error || !tenancy) {
    return false
  }

  // Check if user is tenant of this tenancy
  if (tenancy.tenant_id === userProfile.id) {
    return true
  }

  // Check if user is landlord of this property
  if (tenancy.property.landlord_id === userProfile.id) {
    return true
  }

  // Check if user is in same organization and has landlord/staff role
  if (tenancy.property.organization_id === userProfile.organization_id &&
      ['landlord', 'staff'].includes(userProfile.role)) {
    return true
  }

  return false
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return 'bin'
  return filename.substring(lastDot + 1).toLowerCase()
}