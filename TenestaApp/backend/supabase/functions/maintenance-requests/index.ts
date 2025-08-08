// Tenesta - Maintenance Requests API
// Handles maintenance requests, work orders, and repair tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { headers } from '../_shared/cors.ts'

interface MaintenanceRequest {
  action: 'create' | 'update' | 'get' | 'list' | 'assign' | 'complete';
  
  // Request fields
  request_id?: string;
  tenancy_id?: string;
  title?: string;
  description?: string;
  category?: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'scheduled' | 'completed' | 'cancelled';
  location_details?: string;
  preferred_time?: string;
  
  // Assignment fields
  assigned_to?: string; // user_id of maintenance staff
  estimated_cost?: number;
  scheduled_date?: string;
  completion_notes?: string;
  
  // Filtering
  filter_status?: string[];
  filter_category?: string[];
  filter_priority?: string[];
}

interface MaintenanceResponse {
  success: boolean;
  request?: any;
  requests?: any[];
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

    // Get user profile
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

    const requestData: MaintenanceRequest = await req.json()
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

    let response: MaintenanceResponse = { success: false }

    switch (action) {
      case 'create':
        response = await createMaintenanceRequest(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update':
        response = await updateMaintenanceRequest(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get':
        response = await getMaintenanceRequest(supabaseClient, user.id, userProfile, requestData.request_id!)
        break
      
      case 'list':
        response = await listMaintenanceRequests(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'assign':
        response = await assignMaintenanceRequest(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'complete':
        response = await completeMaintenanceRequest(supabaseClient, user.id, userProfile, requestData)
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
    console.error('Error in maintenance-requests function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function createMaintenanceRequest(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: MaintenanceRequest
): Promise<MaintenanceResponse> {
  const { tenancy_id, title, description, category, priority, location_details, preferred_time } = requestData

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

    // Check if user is tenant, household member, or landlord
    const isTenant = tenancy.tenant_id === userId
    const isLandlord = tenancy.property.landlord_id === userId
    
    // Check if user is household member
    const { data: householdMember } = await supabaseClient
      .from('household_members')
      .select('id')
      .eq('tenancy_id', tenancy_id)
      .eq('user_id', userId)
      .single()

    const isHouseholdMember = !!householdMember

    if (!isTenant && !isLandlord && !isHouseholdMember) {
      return { success: false, error: 'Access denied. You must be associated with this tenancy.' }
    }

    // Create the maintenance request
    const { data: maintenanceRequest, error: requestError } = await supabaseClient
      .from('maintenance_requests')
      .insert({
        tenancy_id,
        requester_id: userId,
        title,
        description,
        category,
        priority: priority || 'medium',
        location_details,
        preferred_time,
        status: 'pending'
      })
      .select(`
        *,
        requester:users!maintenance_requests_requester_id_fkey (id, email, profile),
        assigned_to_user:users!maintenance_requests_assigned_to_fkey (id, email, profile),
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

    if (requestError) {
      console.error('Error creating maintenance request:', requestError)
      return { success: false, error: 'Failed to create maintenance request' }
    }

    // Send notification to landlord
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: tenancy.property.landlord_id,
        title: 'New Maintenance Request',
        content: `A new maintenance request has been submitted for ${tenancy.property.address}: ${title}`,
        type: 'maintenance_scheduled',
        priority: priority === 'urgent' ? 'high' : 'medium',
        action_url: `/maintenance/${maintenanceRequest.id}`,
        metadata: {
          request_id: maintenanceRequest.id,
          category,
          priority,
          requester_role: userProfile.role
        }
      })

    // If requester is not the tenant, also notify the tenant
    if (!isTenant && tenancy.tenant_id) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: tenancy.tenant_id,
          title: 'Maintenance Request Submitted',
          content: `A maintenance request has been submitted for your unit: ${title}`,
          type: 'maintenance_scheduled',
          priority: 'medium',
          action_url: `/maintenance/${maintenanceRequest.id}`,
          metadata: {
            request_id: maintenanceRequest.id,
            category,
            priority,
            submitted_by: userProfile.profile?.full_name || userProfile.email
          }
        })
    }

    return { success: true, request: maintenanceRequest }

  } catch (error) {
    console.error('Error creating maintenance request:', error)
    return { success: false, error: 'Failed to create maintenance request' }
  }
}

async function updateMaintenanceRequest(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: MaintenanceRequest
): Promise<MaintenanceResponse> {
  const { request_id } = requestData

  if (!request_id) {
    return { success: false, error: 'request_id is required' }
  }

  try {
    // Get the request and verify access
    const { data: request, error: requestError } = await supabaseClient
      .from('maintenance_requests')
      .select(`
        *,
        tenancy:tenancies (
          tenant_id,
          property:properties (
            landlord_id
          )
        )
      `)
      .eq('id', request_id)
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Maintenance request not found' }
    }

    // Check access
    const isTenant = request.tenancy.tenant_id === userId
    const isLandlord = request.tenancy.property.landlord_id === userId
    const isRequester = request.requester_id === userId
    const isAssigned = request.assigned_to === userId
    const isAdmin = userProfile.role === 'admin'

    if (!isTenant && !isLandlord && !isRequester && !isAssigned && !isAdmin) {
      return { success: false, error: 'Access denied' }
    }

    // Build update object based on user permissions
    const updateData: any = {}
    
    // Tenants and requesters can update basic info if status is pending
    if ((isTenant || isRequester) && request.status === 'pending') {
      if (requestData.title) updateData.title = requestData.title
      if (requestData.description) updateData.description = requestData.description
      if (requestData.location_details) updateData.location_details = requestData.location_details
      if (requestData.preferred_time) updateData.preferred_time = requestData.preferred_time
      if (requestData.priority) updateData.priority = requestData.priority
    }
    
    // Landlords and admins can update status and assignment
    if (isLandlord || isAdmin) {
      if (requestData.status) updateData.status = requestData.status
      if (requestData.assigned_to) updateData.assigned_to = requestData.assigned_to
      if (requestData.estimated_cost !== undefined) updateData.estimated_cost = requestData.estimated_cost
      if (requestData.scheduled_date) updateData.scheduled_date = requestData.scheduled_date
      if (requestData.priority) updateData.priority = requestData.priority
    }
    
    // Assigned maintenance staff can update status and notes
    if (isAssigned) {
      if (requestData.status) updateData.status = requestData.status
      if (requestData.completion_notes) updateData.completion_notes = requestData.completion_notes
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No valid updates provided' }
    }

    const { data: updatedRequest, error: updateError } = await supabaseClient
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', request_id)
      .select(`
        *,
        requester:users!maintenance_requests_requester_id_fkey (id, email, profile),
        assigned_to_user:users!maintenance_requests_assigned_to_fkey (id, email, profile),
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
      console.error('Error updating maintenance request:', updateError)
      return { success: false, error: 'Failed to update maintenance request' }
    }

    // Send status update notifications
    if (updateData.status) {
      const notificationContent = `Maintenance request "${request.title}" status updated to: ${updateData.status}`
      
      // Notify relevant parties
      const notifyUsers = []
      if (request.tenancy.tenant_id !== userId) notifyUsers.push(request.tenancy.tenant_id)
      if (request.tenancy.property.landlord_id !== userId) notifyUsers.push(request.tenancy.property.landlord_id)
      if (request.requester_id !== userId) notifyUsers.push(request.requester_id)
      
      for (const notifyUserId of notifyUsers) {
        if (notifyUserId) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: notifyUserId,
              title: 'Maintenance Request Updated',
              content: notificationContent,
              type: 'maintenance_scheduled',
              priority: 'medium',
              action_url: `/maintenance/${request_id}`,
              metadata: {
                request_id,
                new_status: updateData.status,
                updated_by_role: userProfile.role
              }
            })
        }
      }
    }

    return { success: true, request: updatedRequest }

  } catch (error) {
    console.error('Error updating maintenance request:', error)
    return { success: false, error: 'Failed to update maintenance request' }
  }
}

async function getMaintenanceRequest(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestId: string
): Promise<MaintenanceResponse> {
  if (!requestId) {
    return { success: false, error: 'request_id is required' }
  }

  try {
    const { data: request, error: requestError } = await supabaseClient
      .from('maintenance_requests')
      .select(`
        *,
        requester:users!maintenance_requests_requester_id_fkey (id, email, profile),
        assigned_to_user:users!maintenance_requests_assigned_to_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Maintenance request not found' }
    }

    // Check access
    const isTenant = request.tenancy.tenant_id === userId
    const isLandlord = request.tenancy.property.landlord_id === userId
    const isRequester = request.requester_id === userId
    const isAssigned = request.assigned_to === userId
    const isAdmin = userProfile.role === 'admin'

    // Check if user is household member
    const { data: householdMember } = await supabaseClient
      .from('household_members')
      .select('id')
      .eq('tenancy_id', request.tenancy_id)
      .eq('user_id', userId)
      .single()

    const isHouseholdMember = !!householdMember

    if (!isTenant && !isLandlord && !isRequester && !isAssigned && !isAdmin && !isHouseholdMember) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, request }

  } catch (error) {
    console.error('Error getting maintenance request:', error)
    return { success: false, error: 'Failed to get maintenance request' }
  }
}

async function listMaintenanceRequests(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: MaintenanceRequest
): Promise<MaintenanceResponse> {
  try {
    let query = supabaseClient
      .from('maintenance_requests')
      .select(`
        *,
        requester:users!maintenance_requests_requester_id_fkey (id, email, profile),
        assigned_to_user:users!maintenance_requests_assigned_to_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (id, email, profile)
          )
        )
      `)

    // Filter based on user role
    if (userProfile.role === 'tenant') {
      // Tenants see requests for their tenancies (including as household members)
      const { data: userTenancies } = await supabaseClient
        .from('tenancies')
        .select('id')
        .eq('tenant_id', userId)

      const { data: householdTenancies } = await supabaseClient
        .from('household_members')
        .select('tenancy_id')
        .eq('user_id', userId)

      const allTenancyIds = [
        ...(userTenancies?.map((t: any) => t.id) || []),
        ...(householdTenancies?.map((h: any) => h.tenancy_id) || [])
      ]

      if (allTenancyIds.length === 0) {
        return { success: true, requests: [] }
      }
      query = query.in('tenancy_id', allTenancyIds)
    } else if (userProfile.role === 'landlord') {
      // Landlords see requests for their properties
      const { data: userProperties } = await supabaseClient
        .from('properties')
        .select(`
          tenancies (id)
        `)
        .eq('landlord_id', userId)

      const tenancyIds: string[] = []
      userProperties?.forEach((property: any) => {
        property.tenancies?.forEach((tenancy: any) => {
          tenancyIds.push(tenancy.id)
        })
      })

      if (tenancyIds.length === 0) {
        return { success: true, requests: [] }
      }
      query = query.in('tenancy_id', tenancyIds)
    } else if (userProfile.role === 'maintenance') {
      // Maintenance staff see assigned requests
      query = query.eq('assigned_to', userId)
    }
    // Admins can see all requests (no additional filter)

    // Apply filters
    if (requestData.filter_status && requestData.filter_status.length > 0) {
      query = query.in('status', requestData.filter_status)
    }
    if (requestData.filter_category && requestData.filter_category.length > 0) {
      query = query.in('category', requestData.filter_category)
    }
    if (requestData.filter_priority && requestData.filter_priority.length > 0) {
      query = query.in('priority', requestData.filter_priority)
    }

    const { data: requests, error: requestsError } = await query
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error listing maintenance requests:', requestsError)
      return { success: false, error: 'Failed to list maintenance requests' }
    }

    return { success: true, requests: requests || [] }

  } catch (error) {
    console.error('Error listing maintenance requests:', error)
    return { success: false, error: 'Failed to list maintenance requests' }
  }
}

async function assignMaintenanceRequest(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: MaintenanceRequest
): Promise<MaintenanceResponse> {
  const { request_id, assigned_to, estimated_cost, scheduled_date } = requestData

  if (!request_id || !assigned_to) {
    return { success: false, error: 'request_id and assigned_to are required' }
  }

  // Only landlords and admins can assign requests
  if (userProfile.role !== 'landlord' && userProfile.role !== 'admin') {
    return { success: false, error: 'Only landlords and admins can assign maintenance requests' }
  }

  try {
    const { data: updatedRequest, error: updateError } = await supabaseClient
      .from('maintenance_requests')
      .update({
        assigned_to,
        estimated_cost,
        scheduled_date,
        status: 'scheduled'
      })
      .eq('id', request_id)
      .select(`
        *,
        requester:users!maintenance_requests_requester_id_fkey (id, email, profile),
        assigned_to_user:users!maintenance_requests_assigned_to_fkey (id, email, profile),
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
      console.error('Error assigning maintenance request:', updateError)
      return { success: false, error: 'Failed to assign maintenance request' }
    }

    // Notify assigned maintenance staff
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: assigned_to,
        title: 'Maintenance Request Assigned',
        content: `You have been assigned a maintenance request: ${updatedRequest.title}`,
        type: 'maintenance_scheduled',
        priority: 'medium',
        action_url: `/maintenance/${request_id}`,
        metadata: {
          request_id,
          estimated_cost,
          scheduled_date
        }
      })

    return { success: true, request: updatedRequest }

  } catch (error) {
    console.error('Error assigning maintenance request:', error)
    return { success: false, error: 'Failed to assign maintenance request' }
  }
}

async function completeMaintenanceRequest(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: MaintenanceRequest
): Promise<MaintenanceResponse> {
  const { request_id, completion_notes } = requestData

  if (!request_id) {
    return { success: false, error: 'request_id is required' }
  }

  try {
    // Get the request
    const { data: request, error: requestError } = await supabaseClient
      .from('maintenance_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Maintenance request not found' }
    }

    // Only assigned staff, landlords, or admins can complete requests
    const canComplete = (
      request.assigned_to === userId ||
      userProfile.role === 'landlord' ||
      userProfile.role === 'admin'
    )

    if (!canComplete) {
      return { success: false, error: 'Only assigned maintenance staff, landlords, or admins can complete requests' }
    }

    const { data: updatedRequest, error: updateError } = await supabaseClient
      .from('maintenance_requests')
      .update({
        status: 'completed',
        completion_notes,
        completed_at: new Date().toISOString(),
        completed_by: userId
      })
      .eq('id', request_id)
      .select(`
        *,
        requester:users!maintenance_requests_requester_id_fkey (id, email, profile),
        assigned_to_user:users!maintenance_requests_assigned_to_fkey (id, email, profile),
        completed_by_user:users!maintenance_requests_completed_by_fkey (id, email, profile),
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
      console.error('Error completing maintenance request:', updateError)
      return { success: false, error: 'Failed to complete maintenance request' }
    }

    // Notify relevant parties of completion
    const notifyUsers = [request.requester_id]
    if (updatedRequest.tenancy.tenant_id !== request.requester_id) {
      notifyUsers.push(updatedRequest.tenancy.tenant_id)
    }

    for (const notifyUserId of notifyUsers) {
      if (notifyUserId && notifyUserId !== userId) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: notifyUserId,
            title: 'Maintenance Request Completed',
            content: `Maintenance request "${request.title}" has been completed.`,
            type: 'maintenance_scheduled',
            priority: 'medium',
            action_url: `/maintenance/${request_id}`,
            metadata: {
              request_id,
              completed_by_role: userProfile.role,
              completion_notes
            }
          })
      }
    }

    return { success: true, request: updatedRequest }

  } catch (error) {
    console.error('Error completing maintenance request:', error)
    return { success: false, error: 'Failed to complete maintenance request' }
  }
}