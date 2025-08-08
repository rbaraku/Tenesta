// Tenesta - Tenant Dashboard API
// Provides all tenant-specific data and functionality

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface TenantDashboardResponse {
  user_profile: any;
  current_tenancy: any;
  payment_status: any;
  upcoming_payments: any[];
  recent_payments: any[];
  active_disputes: any[];
  unread_messages: any[];
  notifications: any[];
  property_details: any;
  lease_documents: any[];
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);
  
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

    // Verify user is a tenant
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'tenant') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Tenant role required.' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Get tenant's current active tenancy
    const { data: currentTenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .select(`
        *,
        property:properties (
          *,
          landlord:users!properties_landlord_id_fkey (
            id, email, profile
          )
        )
      `)
      .eq('tenant_id', user.id)
      .eq('status', 'active')
      .single()

    if (tenancyError && tenancyError.code !== 'PGRST116') {
      throw tenancyError
    }

    let dashboardData: TenantDashboardResponse = {
      user_profile: userProfile,
      current_tenancy: currentTenancy,
      payment_status: null,
      upcoming_payments: [],
      recent_payments: [],
      active_disputes: [],
      unread_messages: [],
      notifications: [],
      property_details: currentTenancy?.property || null,
      lease_documents: []
    }

    // If tenant has an active tenancy, get related data
    if (currentTenancy) {
      // Get payment information
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('tenancy_id', currentTenancy.id)
        .order('due_date', { ascending: false })
        .limit(10)

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
      } else {
        const now = new Date()
        const upcoming = payments?.filter(p => 
          new Date(p.due_date) > now && p.status === 'pending'
        ) || []
        const recent = payments?.filter(p => 
          p.status === 'paid' || new Date(p.due_date) <= now
        ) || []
        
        dashboardData.upcoming_payments = upcoming
        dashboardData.recent_payments = recent
        
        // Current payment status (next due payment)
        dashboardData.payment_status = upcoming[0] || null
      }

      // Get active disputes
      const { data: disputes, error: disputesError } = await supabaseClient
        .from('disputes')
        .select('*')
        .eq('tenancy_id', currentTenancy.id)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })

      if (disputesError) {
        console.error('Error fetching disputes:', disputesError)
      } else {
        dashboardData.active_disputes = disputes || []
      }

      // Get unread messages
      const { data: messages, error: messagesError } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
      } else {
        dashboardData.unread_messages = messages || []
      }

      // Get lease documents
      const { data: documents, error: documentsError } = await supabaseClient
        .from('documents')
        .select('*')
        .eq('tenancy_id', currentTenancy.id)
        .eq('document_type', 'lease')
        .order('created_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
      } else {
        dashboardData.lease_documents = documents || []
      }
    }

    // Get recent notifications
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
    } else {
      dashboardData.notifications = notifications || []
    }

    return new Response(
      JSON.stringify(dashboardData),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in tenant-dashboard function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})