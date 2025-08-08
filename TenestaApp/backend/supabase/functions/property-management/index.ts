// Tenesta - Property Management API
// Handles CRUD operations for properties, tenancies, and property-related data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { headers } from '../_shared/cors.ts'

interface PropertyRequest {
  action: 'create_property' | 'update_property' | 'delete_property' | 
          'get_property' | 'list_properties' | 'create_tenancy' | 
          'update_tenancy' | 'terminate_tenancy' | 'get_tenancy' | 'list_tenancies';
  
  // Property fields
  property_id?: string;
  address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  rent_amount?: number;
  security_deposit?: number;
  property_details?: any;
  status?: 'available' | 'occupied' | 'maintenance' | 'unavailable';
  
  // Tenancy fields
  tenancy_id?: string;
  tenant_id?: string;
  tenant_email?: string;
  lease_start?: string;
  lease_end?: string;
  lease_terms?: any;
  tenancy_status?: 'active' | 'pending' | 'expired' | 'terminated';
}

interface PropertyResponse {
  success: boolean;
  property?: any;
  properties?: any[];
  tenancy?: any;
  tenancies?: any[];
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

    const requestData: PropertyRequest = await req.json()
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

    let response: PropertyResponse = { success: false }

    switch (action) {
      case 'create_property':
        response = await createProperty(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_property':
        response = await updateProperty(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'delete_property':
        response = await deleteProperty(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get_property':
        response = await getProperty(supabaseClient, user.id, userProfile, requestData.property_id!)
        break
      
      case 'list_properties':
        response = await listProperties(supabaseClient, user.id, userProfile)
        break
      
      case 'create_tenancy':
        response = await createTenancy(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_tenancy':
        response = await updateTenancy(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'terminate_tenancy':
        response = await terminateTenancy(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get_tenancy':
        response = await getTenancy(supabaseClient, user.id, userProfile, requestData.tenancy_id!)
        break
      
      case 'list_tenancies':
        response = await listTenancies(supabaseClient, user.id, userProfile, requestData.property_id)
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
    console.error('Error in property-management function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Property CRUD Operations
async function createProperty(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: PropertyRequest
): Promise<PropertyResponse> {
  // Only landlords and admins can create properties
  if (userProfile.role !== 'landlord' && userProfile.role !== 'admin') {
    return { success: false, error: 'Only landlords can create properties' }
  }

  const { address, address_line_2, city, state, zip_code, rent_amount, security_deposit, property_details, status } = requestData

  if (!address || !city || !state || !zip_code) {
    return { success: false, error: 'Missing required fields: address, city, state, zip_code' }
  }

  try {
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .insert({
        address,
        address_line_2,
        city,
        state,
        zip_code,
        landlord_id: userId,
        organization_id: userProfile.organization_id,
        rent_amount,
        security_deposit,
        property_details: property_details || {},
        status: status || 'available'
      })
      .select(`
        *,
        landlord:users!properties_landlord_id_fkey (id, email, profile),
        organization:organizations (id, name)
      `)
      .single()

    if (propertyError) {
      console.error('Error creating property:', propertyError)
      return { success: false, error: 'Failed to create property' }
    }

    return { success: true, property }

  } catch (error) {
    console.error('Error creating property:', error)
    return { success: false, error: 'Failed to create property' }
  }
}

async function updateProperty(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: PropertyRequest
): Promise<PropertyResponse> {
  const { property_id } = requestData

  if (!property_id) {
    return { success: false, error: 'property_id is required' }
  }

  try {
    // Verify ownership
    const { data: existingProperty, error: checkError } = await supabaseClient
      .from('properties')
      .select('landlord_id')
      .eq('id', property_id)
      .single()

    if (checkError || !existingProperty) {
      return { success: false, error: 'Property not found' }
    }

    if (existingProperty.landlord_id !== userId && userProfile.role !== 'admin') {
      return { success: false, error: 'Access denied' }
    }

    // Build update object
    const updateData: any = {}
    if (requestData.address) updateData.address = requestData.address
    if (requestData.address_line_2 !== undefined) updateData.address_line_2 = requestData.address_line_2
    if (requestData.city) updateData.city = requestData.city
    if (requestData.state) updateData.state = requestData.state
    if (requestData.zip_code) updateData.zip_code = requestData.zip_code
    if (requestData.rent_amount !== undefined) updateData.rent_amount = requestData.rent_amount
    if (requestData.security_deposit !== undefined) updateData.security_deposit = requestData.security_deposit
    if (requestData.property_details) updateData.property_details = requestData.property_details
    if (requestData.status) updateData.status = requestData.status

    const { data: property, error: updateError } = await supabaseClient
      .from('properties')
      .update(updateData)
      .eq('id', property_id)
      .select(`
        *,
        landlord:users!properties_landlord_id_fkey (id, email, profile),
        organization:organizations (id, name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating property:', updateError)
      return { success: false, error: 'Failed to update property' }
    }

    return { success: true, property }

  } catch (error) {
    console.error('Error updating property:', error)
    return { success: false, error: 'Failed to update property' }
  }
}

async function deleteProperty(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: PropertyRequest
): Promise<PropertyResponse> {
  const { property_id } = requestData

  if (!property_id) {
    return { success: false, error: 'property_id is required' }
  }

  try {
    // Verify ownership and check for active tenancies
    const { data: property, error: checkError } = await supabaseClient
      .from('properties')
      .select(`
        *,
        tenancies!tenancies_property_id_fkey (
          id, status
        )
      `)
      .eq('id', property_id)
      .single()

    if (checkError || !property) {
      return { success: false, error: 'Property not found' }
    }

    if (property.landlord_id !== userId && userProfile.role !== 'admin') {
      return { success: false, error: 'Access denied' }
    }

    // Check for active tenancies
    const activeTenancies = property.tenancies?.filter((t: any) => t.status === 'active') || []
    if (activeTenancies.length > 0) {
      return { success: false, error: 'Cannot delete property with active tenancies' }
    }

    const { error: deleteError } = await supabaseClient
      .from('properties')
      .delete()
      .eq('id', property_id)

    if (deleteError) {
      console.error('Error deleting property:', deleteError)
      return { success: false, error: 'Failed to delete property' }
    }

    return { success: true }

  } catch (error) {
    console.error('Error deleting property:', error)
    return { success: false, error: 'Failed to delete property' }
  }
}

async function getProperty(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  propertyId: string
): Promise<PropertyResponse> {
  if (!propertyId) {
    return { success: false, error: 'property_id is required' }
  }

  try {
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select(`
        *,
        landlord:users!properties_landlord_id_fkey (id, email, profile),
        organization:organizations (id, name),
        tenancies!tenancies_property_id_fkey (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile)
        )
      `)
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return { success: false, error: 'Property not found' }
    }

    // Check access - landlord, tenant, or admin
    const isLandlord = property.landlord_id === userId
    const isTenant = property.tenancies?.some((t: any) => t.tenant_id === userId && t.status === 'active')
    const isAdmin = userProfile.role === 'admin'

    if (!isLandlord && !isTenant && !isAdmin) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, property }

  } catch (error) {
    console.error('Error getting property:', error)
    return { success: false, error: 'Failed to get property' }
  }
}

async function listProperties(
  supabaseClient: any,
  userId: string,
  userProfile: any
): Promise<PropertyResponse> {
  try {
    let query = supabaseClient
      .from('properties')
      .select(`
        *,
        landlord:users!properties_landlord_id_fkey (id, email, profile),
        organization:organizations (id, name),
        tenancies!tenancies_property_id_fkey (
          *,
          tenant:users!tenancies_tenant_id_fkey (id, email, profile)
        )
      `)

    // Filter based on user role
    if (userProfile.role === 'landlord') {
      query = query.eq('landlord_id', userId)
    } else if (userProfile.role === 'tenant') {
      // Tenants can only see properties they're associated with
      const { data: userTenancies } = await supabaseClient
        .from('tenancies')
        .select('property_id')
        .eq('tenant_id', userId)
        .eq('status', 'active')

      const propertyIds = userTenancies?.map((t: any) => t.property_id) || []
      if (propertyIds.length === 0) {
        return { success: true, properties: [] }
      }
      query = query.in('id', propertyIds)
    }
    // Admins can see all properties (no additional filter)

    const { data: properties, error: propertiesError } = await query
      .order('created_at', { ascending: false })

    if (propertiesError) {
      console.error('Error listing properties:', propertiesError)
      return { success: false, error: 'Failed to list properties' }
    }

    return { success: true, properties: properties || [] }

  } catch (error) {
    console.error('Error listing properties:', error)
    return { success: false, error: 'Failed to list properties' }
  }
}

// Tenancy Management Functions
async function createTenancy(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: PropertyRequest
): Promise<PropertyResponse> {
  // Only landlords and admins can create tenancies
  if (userProfile.role !== 'landlord' && userProfile.role !== 'admin') {
    return { success: false, error: 'Only landlords can create tenancies' }
  }

  const { property_id, tenant_email, rent_amount, security_deposit, lease_start, lease_end, lease_terms } = requestData

  if (!property_id || !tenant_email || !rent_amount || !security_deposit || !lease_start || !lease_end) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    // Verify property ownership
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return { success: false, error: 'Property not found' }
    }

    if (property.landlord_id !== userId && userProfile.role !== 'admin') {
      return { success: false, error: 'Access denied' }
    }

    // Find tenant by email
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', tenant_email)
      .eq('role', 'tenant')
      .single()

    if (tenantError || !tenant) {
      return { success: false, error: 'Tenant not found' }
    }

    // Check for existing active tenancy on this property
    const { data: existingTenancy, error: existingError } = await supabaseClient
      .from('tenancies')
      .select('id')
      .eq('property_id', property_id)
      .eq('status', 'active')
      .single()

    if (existingTenancy) {
      return { success: false, error: 'Property already has an active tenancy' }
    }

    // Create the tenancy
    const { data: tenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .insert({
        tenant_id: tenant.id,
        property_id,
        rent_amount,
        security_deposit,
        lease_start,
        lease_end,
        status: 'pending',
        lease_terms: lease_terms || {}
      })
      .select(`
        *,
        tenant:users!tenancies_tenant_id_fkey (id, email, profile),
        property:properties (
          *,
          landlord:users!properties_landlord_id_fkey (id, email, profile)
        )
      `)
      .single()

    if (tenancyError) {
      console.error('Error creating tenancy:', tenancyError)
      return { success: false, error: 'Failed to create tenancy' }
    }

    // Update property status to occupied
    await supabaseClient
      .from('properties')
      .update({ status: 'occupied' })
      .eq('id', property_id)

    // Send notification to tenant
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: tenant.id,
        title: 'New Lease Agreement',
        content: `You have been added as a tenant for ${property.address}`,
        type: 'lease_expiring',
        priority: 'high',
        action_url: `/tenancies/${tenancy.id}`,
        metadata: {
          tenancy_id: tenancy.id,
          property_id
        }
      })

    return { success: true, tenancy }

  } catch (error) {
    console.error('Error creating tenancy:', error)
    return { success: false, error: 'Failed to create tenancy' }
  }
}

async function updateTenancy(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: PropertyRequest
): Promise<PropertyResponse> {
  const { tenancy_id } = requestData

  if (!tenancy_id) {
    return { success: false, error: 'tenancy_id is required' }
  }

  try {
    // Get tenancy and verify access
    const { data: tenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .select(`
        *,
        property:properties (
          landlord_id
        )
      `)
      .eq('id', tenancy_id)
      .single()

    if (tenancyError || !tenancy) {
      return { success: false, error: 'Tenancy not found' }
    }

    // Check access
    const isLandlord = tenancy.property.landlord_id === userId
    const isTenant = tenancy.tenant_id === userId
    const isAdmin = userProfile.role === 'admin'

    if (!isLandlord && !isTenant && !isAdmin) {
      return { success: false, error: 'Access denied' }
    }

    // Build update object (only allow certain fields to be updated by tenants)
    const updateData: any = {}
    
    if (isLandlord || isAdmin) {
      if (requestData.rent_amount !== undefined) updateData.rent_amount = requestData.rent_amount
      if (requestData.security_deposit !== undefined) updateData.security_deposit = requestData.security_deposit
      if (requestData.lease_start) updateData.lease_start = requestData.lease_start
      if (requestData.lease_end) updateData.lease_end = requestData.lease_end
      if (requestData.tenancy_status) updateData.status = requestData.tenancy_status
      if (requestData.lease_terms) updateData.lease_terms = requestData.lease_terms
    }

    // Tenants can only update certain fields (if any)
    if (isTenant && !isLandlord && !isAdmin) {
      // For now, tenants can't directly update tenancy data
      // This could be extended to allow updating emergency contacts, etc.
      return { success: false, error: 'Tenants cannot directly update lease data' }
    }

    const { data: updatedTenancy, error: updateError } = await supabaseClient
      .from('tenancies')
      .update(updateData)
      .eq('id', tenancy_id)
      .select(`
        *,
        tenant:users!tenancies_tenant_id_fkey (id, email, profile),
        property:properties (
          *,
          landlord:users!properties_landlord_id_fkey (id, email, profile)
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating tenancy:', updateError)
      return { success: false, error: 'Failed to update tenancy' }
    }

    return { success: true, tenancy: updatedTenancy }

  } catch (error) {
    console.error('Error updating tenancy:', error)
    return { success: false, error: 'Failed to update tenancy' }
  }
}

async function terminateTenancy(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: PropertyRequest
): Promise<PropertyResponse> {
  const { tenancy_id } = requestData

  if (!tenancy_id) {
    return { success: false, error: 'tenancy_id is required' }
  }

  try {
    // Get tenancy and verify access
    const { data: tenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .select(`
        *,
        property:properties (
          landlord_id
        )
      `)
      .eq('id', tenancy_id)
      .single()

    if (tenancyError || !tenancy) {
      return { success: false, error: 'Tenancy not found' }
    }

    // Only landlords and admins can terminate tenancies
    const isLandlord = tenancy.property.landlord_id === userId
    const isAdmin = userProfile.role === 'admin'

    if (!isLandlord && !isAdmin) {
      return { success: false, error: 'Only landlords can terminate tenancies' }
    }

    // Update tenancy status to terminated
    const { data: updatedTenancy, error: updateError } = await supabaseClient
      .from('tenancies')
      .update({
        status: 'terminated'
      })
      .eq('id', tenancy_id)
      .select(`
        *,
        tenant:users!tenancies_tenant_id_fkey (id, email, profile),
        property:properties (
          *,
          landlord:users!properties_landlord_id_fkey (id, email, profile)
        )
      `)
      .single()

    if (updateError) {
      console.error('Error terminating tenancy:', updateError)
      return { success: false, error: 'Failed to terminate tenancy' }
    }

    // Update property status to available
    await supabaseClient
      .from('properties')
      .update({ status: 'available' })
      .eq('id', tenancy.property_id)

    // Send notification to tenant
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: tenancy.tenant_id,
        title: 'Lease Terminated',
        content: `Your lease for ${tenancy.property.address} has been terminated`,
        type: 'lease_expiring',
        priority: 'high',
        metadata: {
          tenancy_id,
          property_id: tenancy.property_id
        }
      })

    return { success: true, tenancy: updatedTenancy }

  } catch (error) {
    console.error('Error terminating tenancy:', error)
    return { success: false, error: 'Failed to terminate tenancy' }
  }
}

async function getTenancy(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  tenancyId: string
): Promise<PropertyResponse> {
  if (!tenancyId) {
    return { success: false, error: 'tenancy_id is required' }
  }

  try {
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
      .eq('id', tenancyId)
      .single()

    if (tenancyError || !tenancy) {
      return { success: false, error: 'Tenancy not found' }
    }

    // Check access
    const isLandlord = tenancy.property.landlord_id === userId
    const isTenant = tenancy.tenant_id === userId
    const isAdmin = userProfile.role === 'admin'

    if (!isLandlord && !isTenant && !isAdmin) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, tenancy }

  } catch (error) {
    console.error('Error getting tenancy:', error)
    return { success: false, error: 'Failed to get tenancy' }
  }
}

async function listTenancies(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  propertyId?: string
): Promise<PropertyResponse> {
  try {
    let query = supabaseClient
      .from('tenancies')
      .select(`
        *,
        tenant:users!tenancies_tenant_id_fkey (id, email, profile),
        property:properties (
          *,
          landlord:users!properties_landlord_id_fkey (id, email, profile)
        )
      `)

    // Filter based on user role
    if (userProfile.role === 'tenant') {
      query = query.eq('tenant_id', userId)
    } else if (userProfile.role === 'landlord') {
      // Get landlord's property IDs
      const { data: properties } = await supabaseClient
        .from('properties')
        .select('id')
        .eq('landlord_id', userId)

      const propertyIds = properties?.map((p: any) => p.id) || []
      if (propertyIds.length === 0) {
        return { success: true, tenancies: [] }
      }
      query = query.in('property_id', propertyIds)
    }
    // Admins can see all tenancies (no additional filter)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: tenancies, error: tenanciesError } = await query
      .order('created_at', { ascending: false })

    if (tenanciesError) {
      console.error('Error listing tenancies:', tenanciesError)
      return { success: false, error: 'Failed to list tenancies' }
    }

    return { success: true, tenancies: tenancies || [] }

  } catch (error) {
    console.error('Error listing tenancies:', error)
    return { success: false, error: 'Failed to list tenancies' }
  }
}