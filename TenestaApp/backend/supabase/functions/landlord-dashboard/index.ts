// Tenesta - Landlord Dashboard API
// Provides all landlord-specific data and portfolio management functionality

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface LandlordDashboardResponse {
  user_profile: any;
  properties: any[];
  portfolio_summary: {
    total_properties: number;
    occupied_units: number;
    available_units: number;
    maintenance_units: number;
    total_monthly_rent: number;
    occupancy_rate: number;
  };
  rent_collection: {
    current_month_collected: number;
    current_month_pending: number;
    collection_rate: number;
    overdue_payments: any[];
  };
  recent_activity: any[];
  active_disputes: any[];
  expiring_leases: any[];
  notifications: any[];
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

    // Verify user is a landlord
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'landlord') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Landlord role required.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Get landlord's properties with tenancy information
    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select(`
        *,
        tenancies!tenancies_property_id_fkey (
          *,
          tenant:users!tenancies_tenant_id_fkey (
            id, email, profile
          ),
          payments (
            id, amount, due_date, paid_date, status
          )
        )
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })

    if (propertiesError) {
      throw propertiesError
    }

    // Calculate portfolio summary
    const totalProperties = properties?.length || 0
    const occupiedUnits = properties?.filter(p => p.status === 'occupied').length || 0
    const availableUnits = properties?.filter(p => p.status === 'available').length || 0
    const maintenanceUnits = properties?.filter(p => p.status === 'maintenance').length || 0
    const totalMonthlyRent = properties?.reduce((sum, p) => sum + (p.rent_amount || 0), 0) || 0
    const occupancyRate = totalProperties > 0 ? (occupiedUnits / totalProperties) * 100 : 0

    // Calculate rent collection data
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    let currentMonthCollected = 0
    let currentMonthPending = 0
    let overduePayments: any[] = []

    // Process all payments from all properties
    properties?.forEach(property => {
      property.tenancies?.forEach((tenancy: any) => {
        tenancy.payments?.forEach((payment: any) => {
          const paymentDate = new Date(payment.due_date)
          const isCurrentMonth = paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
          
          if (isCurrentMonth) {
            if (payment.status === 'paid') {
              currentMonthCollected += payment.amount
            } else if (payment.status === 'pending') {
              currentMonthPending += payment.amount
            }
          }
          
          // Check for overdue payments
          if (payment.status === 'pending' && new Date(payment.due_date) < new Date()) {
            overduePayments.push({
              ...payment,
              tenant: tenancy.tenant,
              property: property,
              days_overdue: Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))
            })
          }
        })
      })
    })

    const collectionRate = (currentMonthCollected + currentMonthPending) > 0 
      ? (currentMonthCollected / (currentMonthCollected + currentMonthPending)) * 100 
      : 0

    // Get active disputes for landlord's properties
    const tenancyIds = properties?.flatMap(p => 
      p.tenancies?.map(t => t.id) || []
    ) || []
    let activeDisputes: any[] = []
    
    if (tenancyIds.length > 0) {
      const { data: disputes, error: disputesError } = await supabaseClient
        .from('disputes')
        .select(`
          *,
          tenancy:tenancies (
            id,
            tenant:users!tenancies_tenant_id_fkey (
              id, email, profile
            ),
            property:properties (
              id, address
            )
          )
        `)
        .in('tenancy_id', tenancyIds)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })

      if (!disputesError) {
        activeDisputes = disputes || []
      }
    }

    // Get expiring leases (within next 90 days)
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

    let expiringLeases: any[] = []
    properties?.forEach(property => {
      property.tenancies?.forEach((tenancy: any) => {
        if (tenancy.status === 'active' && new Date(tenancy.lease_end) <= ninetyDaysFromNow) {
          expiringLeases.push({
            ...tenancy,
            property: property,
            days_until_expiry: Math.floor((new Date(tenancy.lease_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          })
        }
      })
    })

    // Get recent activity (payments, disputes, messages)
    // For now, we'll use recent payments as activity
    let recentActivity: any[] = []
    properties?.forEach(property => {
      property.tenancies?.forEach((tenancy: any) => {
        tenancy.payments?.forEach((payment: any) => {
          if (payment.paid_date) {
            recentActivity.push({
              type: 'payment',
              description: `Payment received from ${tenancy.tenant?.profile?.full_name || tenancy.tenant?.email}`,
              amount: payment.amount,
              date: payment.paid_date,
              property: property,
              tenant: tenancy.tenant
            })
          }
        })
      })
    })

    // Sort recent activity by date
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    recentActivity = recentActivity.slice(0, 10) // Limit to 10 most recent

    // Get notifications
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
    }

    const dashboardData: LandlordDashboardResponse = {
      user_profile: userProfile,
      properties: properties || [],
      portfolio_summary: {
        total_properties: totalProperties,
        occupied_units: occupiedUnits,
        available_units: availableUnits,
        maintenance_units: maintenanceUnits,
        total_monthly_rent: totalMonthlyRent,
        occupancy_rate: Math.round(occupancyRate * 100) / 100
      },
      rent_collection: {
        current_month_collected: currentMonthCollected,
        current_month_pending: currentMonthPending,
        collection_rate: Math.round(collectionRate * 100) / 100,
        overdue_payments: overduePayments.slice(0, 10) // Limit to 10 most urgent
      },
      recent_activity: recentActivity,
      active_disputes: activeDisputes,
      expiring_leases: expiringLeases,
      notifications: notifications || []
    }

    return new Response(
      JSON.stringify(dashboardData),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in landlord-dashboard function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})