// Tenesta - Dispute Management API
// Handles creating, updating, and resolving disputes between tenants and landlords

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { headers } from '../_shared/cors.ts'

interface DisputeRequest {
  action: 'create' | 'update' | 'resolve' | 'get' | 'list';
  dispute_id?: string;
  tenancy_id?: string;
  title?: string;
  description?: string;
  category?: 'maintenance' | 'payment' | 'lease_violation' | 'noise' | 'damage' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_notes?: string;
  evidence_files?: string[];
}

interface DisputeResponse {
  success: boolean;
  dispute?: any;
  disputes?: any[];
  error?: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = headers(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
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
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const requestData: DisputeRequest = await req.json()
    const { action } = requestData

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    let response: DisputeResponse = { success: false }

    switch (action) {
      case 'create':
        response = await createDispute(supabaseClient, user.id, userProfile.role, requestData)
        break
      
      case 'update':
        response = await updateDispute(supabaseClient, user.id, userProfile.role, requestData)
        break
      
      case 'resolve':
        response = await resolveDispute(supabaseClient, user.id, userProfile.role, requestData)
        break
      
      case 'get':
        response = await getDispute(supabaseClient, user.id, userProfile.role, requestData.dispute_id!)
        break
      
      case 'list':
        response = await listDisputes(supabaseClient, user.id, userProfile.role, requestData.tenancy_id)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...headers, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400,
      }
    )

  } catch (error) {
    console.error('Error in dispute-management function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function createDispute(
  supabaseClient: any, 
  userId: string, 
  userRole: string, 
  requestData: DisputeRequest
): Promise<DisputeResponse> {
  const { tenancy_id, title, description, category, priority } = requestData

  if (!tenancy_id || !title || !description || !category) {
    return { success: false, error: 'Missing required fields: tenancy_id, title, description, category' }
  }

  try {
    // Verify user has access to this tenancy
    const { data: tenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .select(`
        *,
        tenant:users!tenancies_tenant_id_fkey (id, email, profile),
        property:properties (
          *,
          landlord:users!properties_landlord_id_fkey (id, email, profile)
        )
      `)
      .eq('id', tenancy_id)
      .single()

    if (tenancyError || !tenancy) {
      return { success: false, error: 'Tenancy not found' }
    }

    // Check if user is either the tenant or the landlord
    const isTenant = tenancy.tenant_id === userId
    const isLandlord = tenancy.property.landlord_id === userId

    if (!isTenant && !isLandlord) {
      return { success: false, error: 'Access denied. You must be either the tenant or landlord of this property.' }
    }

    // Create the dispute
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('disputes')
      .insert({
        tenancy_id,
        reporter_id: userId,
        title,
        description,
        category,
        priority: priority || 'medium',
        status: 'open'
      })
      .select(`
        *,
        reporter:users!disputes_reporter_id_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)
      .single()

    if (disputeError) {
      console.error('Error creating dispute:', disputeError)
      return { success: false, error: 'Failed to create dispute' }
    }

    // Send notification to the other party
    const otherPartyId = isTenant ? tenancy.property.landlord_id : tenancy.tenant_id
    const otherPartyRole = isTenant ? 'landlord' : 'tenant'
    
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: otherPartyId,
        title: 'New Dispute Created',
        content: `A new dispute has been filed regarding ${tenancy.property.address}: ${title}`,
        type: 'dispute_update',
        priority: priority === 'urgent' ? 'high' : 'medium',
        action_url: `/disputes/${dispute.id}`,
        metadata: {
          dispute_id: dispute.id,
          category,
          reporter_role: userRole
        }
      })

    return { success: true, dispute }

  } catch (error) {
    console.error('Error creating dispute:', error)
    return { success: false, error: 'Failed to create dispute' }
  }
}

async function updateDispute(
  supabaseClient: any, 
  userId: string, 
  userRole: string, 
  requestData: DisputeRequest
): Promise<DisputeResponse> {
  const { dispute_id, status, priority, description } = requestData

  if (!dispute_id) {
    return { success: false, error: 'dispute_id is required' }
  }

  try {
    // Get the dispute and verify access
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('disputes')
      .select(`
        *,
        tenancy:tenancies (
          tenant_id,
          property:properties (
            landlord_id
          )
        )
      `)
      .eq('id', dispute_id)
      .single()

    if (disputeError || !dispute) {
      return { success: false, error: 'Dispute not found' }
    }

    // Check access
    const isTenant = dispute.tenancy.tenant_id === userId
    const isLandlord = dispute.tenancy.property.landlord_id === userId
    const isReporter = dispute.reporter_id === userId

    if (!isTenant && !isLandlord) {
      return { success: false, error: 'Access denied' }
    }

    // Build update object
    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (description) updateData.description = description

    // Only allow certain status changes based on role
    if (status) {
      if (status === 'in_progress' && !isLandlord) {
        return { success: false, error: 'Only landlords can mark disputes as in progress' }
      }
      if (status === 'resolved' && !isLandlord) {
        return { success: false, error: 'Only landlords can mark disputes as resolved' }
      }
    }

    const { data: updatedDispute, error: updateError } = await supabaseClient
      .from('disputes')
      .update(updateData)
      .eq('id', dispute_id)
      .select(`
        *,
        reporter:users!disputes_reporter_id_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating dispute:', updateError)
      return { success: false, error: 'Failed to update dispute' }
    }

    // Send notification about the update
    const otherPartyId = isTenant ? dispute.tenancy.property.landlord_id : dispute.tenancy.tenant_id
    
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: otherPartyId,
        title: 'Dispute Updated',
        content: `Dispute "${dispute.title}" has been updated`,
        type: 'dispute_update',
        priority: 'medium',
        action_url: `/disputes/${dispute.id}`,
        metadata: {
          dispute_id: dispute.id,
          updated_by_role: userRole,
          new_status: status
        }
      })

    return { success: true, dispute: updatedDispute }

  } catch (error) {
    console.error('Error updating dispute:', error)
    return { success: false, error: 'Failed to update dispute' }
  }
}

async function resolveDispute(
  supabaseClient: any, 
  userId: string, 
  userRole: string, 
  requestData: DisputeRequest
): Promise<DisputeResponse> {
  const { dispute_id, resolution_notes } = requestData

  if (!dispute_id || !resolution_notes) {
    return { success: false, error: 'dispute_id and resolution_notes are required' }
  }

  try {
    // Get the dispute and verify access
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('disputes')
      .select(`
        *,
        tenancy:tenancies (
          tenant_id,
          property:properties (
            landlord_id
          )
        )
      `)
      .eq('id', dispute_id)
      .single()

    if (disputeError || !dispute) {
      return { success: false, error: 'Dispute not found' }
    }

    // Only landlords and admins can resolve disputes
    const isLandlord = dispute.tenancy.property.landlord_id === userId
    const isAdmin = userRole === 'admin'

    if (!isLandlord && !isAdmin) {
      return { success: false, error: 'Only landlords or admins can resolve disputes' }
    }

    const { data: resolvedDispute, error: resolveError } = await supabaseClient
      .from('disputes')
      .update({
        status: 'resolved',
        resolution_notes,
        resolved_at: new Date().toISOString(),
        resolved_by: userId
      })
      .eq('id', dispute_id)
      .select(`
        *,
        reporter:users!disputes_reporter_id_fkey (id, email, profile),
        resolver:users!disputes_resolved_by_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)
      .single()

    if (resolveError) {
      console.error('Error resolving dispute:', resolveError)
      return { success: false, error: 'Failed to resolve dispute' }
    }

    // Send notification to all parties
    const tenantId = dispute.tenancy.tenant_id
    const landlordId = dispute.tenancy.property.landlord_id
    const reporterId = dispute.reporter_id

    // Notify tenant (if not the resolver)
    if (tenantId !== userId) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: tenantId,
          title: 'Dispute Resolved',
          content: `Your dispute "${dispute.title}" has been resolved.`,
          type: 'dispute_update',
          priority: 'medium',
          action_url: `/disputes/${dispute.id}`,
          metadata: {
            dispute_id: dispute.id,
            resolved_by_role: userRole
          }
        })
    }

    // Notify landlord (if not the resolver)
    if (landlordId !== userId) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: landlordId,
          title: 'Dispute Resolved',
          content: `Dispute "${dispute.title}" has been resolved.`,
          type: 'dispute_update',
          priority: 'medium',
          action_url: `/disputes/${dispute.id}`,
          metadata: {
            dispute_id: dispute.id,
            resolved_by_role: userRole
          }
        })
    }

    return { success: true, dispute: resolvedDispute }

  } catch (error) {
    console.error('Error resolving dispute:', error)
    return { success: false, error: 'Failed to resolve dispute' }
  }
}

async function getDispute(
  supabaseClient: any, 
  userId: string, 
  userRole: string, 
  disputeId: string
): Promise<DisputeResponse> {
  if (!disputeId) {
    return { success: false, error: 'dispute_id is required' }
  }

  try {
    const { data: dispute, error: disputeError } = await supabaseClient
      .from('disputes')
      .select(`
        *,
        reporter:users!disputes_reporter_id_fkey (id, email, profile),
        resolver:users!disputes_resolved_by_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute) {
      return { success: false, error: 'Dispute not found' }
    }

    // Check access
    const isTenant = dispute.tenancy.tenant_id === userId
    const isLandlord = dispute.tenancy.property.landlord_id === userId
    const isAdmin = userRole === 'admin'

    if (!isTenant && !isLandlord && !isAdmin) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, dispute }

  } catch (error) {
    console.error('Error getting dispute:', error)
    return { success: false, error: 'Failed to get dispute' }
  }
}

async function listDisputes(
  supabaseClient: any, 
  userId: string, 
  userRole: string, 
  tenancyId?: string
): Promise<DisputeResponse> {
  try {
    let query = supabaseClient
      .from('disputes')
      .select(`
        *,
        reporter:users!disputes_reporter_id_fkey (id, email, profile),
        resolver:users!disputes_resolved_by_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)

    // Filter based on user role and access
    if (userRole === 'tenant') {
      // Tenants can see disputes for their tenancies
      const { data: userTenancies } = await supabaseClient
        .from('tenancies')
        .select('id')
        .eq('tenant_id', userId)

      const tenancyIds = userTenancies?.map((t: any) => t.id) || []
      query = query.in('tenancy_id', tenancyIds)
    } else if (userRole === 'landlord') {
      // Landlords can see disputes for their properties
      const { data: userProperties } = await supabaseClient
        .from('properties')
        .select(`
          id,
          tenancies (id)
        `)
        .eq('landlord_id', userId)

      const tenancyIds: string[] = []
      userProperties?.forEach((property: any) => {
        property.tenancies?.forEach((tenancy: any) => {
          tenancyIds.push(tenancy.id)
        })
      })
      
      query = query.in('tenancy_id', tenancyIds)
    }
    // Admins can see all disputes (no additional filter)

    if (tenancyId) {
      query = query.eq('tenancy_id', tenancyId)
    }

    const { data: disputes, error: disputesError } = await query
      .order('created_at', { ascending: false })

    if (disputesError) {
      console.error('Error listing disputes:', disputesError)
      return { success: false, error: 'Failed to list disputes' }
    }

    return { success: true, disputes: disputes || [] }

  } catch (error) {
    console.error('Error listing disputes:', error)
    return { success: false, error: 'Failed to list disputes' }
  }
}