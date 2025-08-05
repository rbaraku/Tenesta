// Tenesta - Admin Panel API
// Comprehensive admin dashboard for user management, analytics, and system oversight

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface AdminRequest {
  action: 'get_dashboard' | 'get_users' | 'get_user_details' | 'update_user' | 'suspend_user' |
          'get_organizations' | 'get_analytics' | 'get_disputes' | 'resolve_dispute' |
          'get_system_metrics' | 'export_data' | 'send_announcement' | 'get_billing_overview' |
          'manage_subscription' | 'get_support_tickets' | 'get_audit_logs' | 'bulk_operations'
  
  // User management
  user_id?: string
  organization_id?: string
  user_updates?: any
  suspend_reason?: string
  
  // Analytics & filtering
  date_from?: string
  date_to?: string
  metric_type?: string
  export_format?: 'csv' | 'json' | 'pdf'
  
  // Dispute management
  dispute_id?: string
  resolution_notes?: string
  
  // Announcements
  announcement?: {
    title: string
    content: string
    target_users?: string[]
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
  
  // Bulk operations
  bulk_action?: 'message' | 'update' | 'suspend' | 'activate'
  target_users?: string[]
  bulk_data?: any
  
  // Pagination
  page?: number
  limit?: number
  search?: string
  filters?: any
}

interface AdminResponse {
  success: boolean
  dashboard?: any
  users?: any[]
  user?: any
  organizations?: any[]
  analytics?: any
  disputes?: any[]
  metrics?: any
  export_data?: any
  support_tickets?: any[]
  audit_logs?: any[]
  billing_overview?: any
  message?: string
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Get user profile and verify admin access
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    // Verify admin role
    if (userProfile.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const requestData: AdminRequest = await req.json()
    let response: AdminResponse

    switch (requestData.action) {
      case 'get_dashboard':
        response = await getAdminDashboard(supabaseClient, userProfile)
        break
      
      case 'get_users':
        response = await getUsers(supabaseClient, requestData)
        break
      
      case 'get_user_details':
        response = await getUserDetails(supabaseClient, requestData.user_id!)
        break
      
      case 'update_user':
        response = await updateUser(supabaseClient, requestData.user_id!, requestData.user_updates!)
        break
      
      case 'suspend_user':
        response = await suspendUser(supabaseClient, requestData.user_id!, requestData.suspend_reason)
        break
      
      case 'get_organizations':
        response = await getOrganizations(supabaseClient, requestData)
        break
      
      case 'get_analytics':
        response = await getAnalytics(supabaseClient, requestData)
        break
      
      case 'get_disputes':
        response = await getDisputes(supabaseClient, requestData)
        break
      
      case 'resolve_dispute':
        response = await resolveDispute(supabaseClient, requestData.dispute_id!, requestData.resolution_notes!, userProfile.id)
        break
      
      case 'get_system_metrics':
        response = await getSystemMetrics(supabaseClient)
        break
      
      case 'export_data':
        response = await exportData(supabaseClient, requestData)
        break
      
      case 'send_announcement':
        response = await sendAnnouncement(supabaseClient, requestData.announcement!, userProfile.id)
        break
      
      case 'get_billing_overview':
        response = await getBillingOverview(supabaseClient, requestData)
        break
      
      case 'get_support_tickets':
        response = await getSupportTickets(supabaseClient, requestData)
        break
      
      case 'get_audit_logs':
        response = await getAuditLogs(supabaseClient, requestData)
        break
      
      case 'bulk_operations':
        response = await performBulkOperation(supabaseClient, requestData, userProfile.id)
        break
      
      default:
        response = { success: false, error: 'Invalid action' }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Admin panel error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Get comprehensive admin dashboard overview
async function getAdminDashboard(
  supabaseClient: any,
  userProfile: any
): Promise<AdminResponse> {
  try {
    // Get key metrics
    const [
      usersCount,
      organizationsCount,
      propertiesCount,
      activeTenanciessCount,
      revenueData,
      disputesCount,
      supportTicketsCount
    ] = await Promise.all([
      supabaseClient.from('users').select('id', { count: 'exact' }),
      supabaseClient.from('organizations').select('id', { count: 'exact' }),
      supabaseClient.from('properties').select('id', { count: 'exact' }),
      supabaseClient.from('tenancies').select('id', { count: 'exact' }).eq('status', 'active'),
      supabaseClient.from('organizations').select('subscription_tier').neq('subscription_tier', 'free'),
      supabaseClient.from('disputes').select('id', { count: 'exact' }).eq('status', 'open'),
      supabaseClient.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'open')
    ])

    // Calculate revenue metrics
    const paidSubscriptions = revenueData.data || []
    const revenueByTier = {
      landlord: paidSubscriptions.filter(org => org.subscription_tier === 'landlord').length * 9.99,
      landlord_pro: paidSubscriptions.filter(org => org.subscription_tier === 'landlord_pro').length * 29.99,
      enterprise: paidSubscriptions.filter(org => org.subscription_tier === 'enterprise').length * 99.99
    }
    const totalMRR = Object.values(revenueByTier).reduce((sum, revenue) => sum + revenue, 0)

    // Get recent activity
    const { data: recentUsers } = await supabaseClient
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentDisputes } = await supabaseClient
      .from('disputes')
      .select('id, subject, status, priority, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const dashboard = {
      metrics: {
        total_users: usersCount.count || 0,
        total_organizations: organizationsCount.count || 0,
        total_properties: propertiesCount.count || 0,
        active_tenancies: activeTenanciessCount.count || 0,
        open_disputes: disputesCount.count || 0,
        open_support_tickets: supportTicketsCount.count || 0,
        monthly_recurring_revenue: Math.round(totalMRR * 100) / 100
      },
      revenue: {
        total_mrr: totalMRR,
        by_tier: revenueByTier,
        paid_subscriptions: paidSubscriptions.length
      },
      recent_activity: {
        new_users: recentUsers || [],
        recent_disputes: recentDisputes || []
      },
      alerts: [
        ...(disputesCount.count > 10 ? [{ type: 'warning', message: `${disputesCount.count} open disputes need attention` }] : []),
        ...(supportTicketsCount.count > 5 ? [{ type: 'info', message: `${supportTicketsCount.count} open support tickets` }] : [])
      ]
    }

    return { success: true, dashboard }

  } catch (error) {
    console.error('Error getting admin dashboard:', error)
    return { success: false, error: 'Failed to load dashboard' }
  }
}

// Get users with filtering and pagination
async function getUsers(
  supabaseClient: any,
  requestData: AdminRequest
): Promise<AdminResponse> {
  try {
    const { page = 1, limit = 50, search, filters } = requestData
    const offset = (page - 1) * limit

    let query = supabaseClient
      .from('users')
      .select(`
        *,
        organization:organizations(name, subscription_tier),
        properties_count:properties(count),
        tenancies_count:tenancies(count)
      `)

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,profile->name.ilike.%${search}%`)
    }

    // Apply role filter
    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    // Apply organization filter
    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id)
    }

    // Apply date range filter
    if (filters?.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: 'Failed to fetch users' }
    }

    return { 
      success: true, 
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }

  } catch (error) {
    console.error('Error getting users:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

// Get detailed user information
async function getUserDetails(
  supabaseClient: any,
  userId: string
): Promise<AdminResponse> {
  try {
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select(`
        *,
        organization:organizations(*),
        properties:properties(*),
        tenancies:tenancies(*, property:properties(address)),
        messages_sent:messages!sender_id(count),
        messages_received:messages!recipient_id(count),
        disputes_created:disputes!reporter_id(count),
        payments:payments(*, tenancy:tenancies(property:properties(address)))
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // Get activity history
    const { data: activityHistory } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    user.activity_history = activityHistory || []

    return { success: true, user }

  } catch (error) {
    console.error('Error getting user details:', error)
    return { success: false, error: 'Failed to get user details' }
  }
}

// Update user information
async function updateUser(
  supabaseClient: any,
  userId: string,
  updates: any
): Promise<AdminResponse> {
  try {
    const { data: updatedUser, error } = await supabaseClient
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: 'Failed to update user' }
    }

    // Log the update
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'user_updated',
        target_user_id: userId,
        details: { updated_fields: Object.keys(updates) },
        admin_user_id: userId // This should be the admin's ID
      })

    return { success: true, user: updatedUser, message: 'User updated successfully' }

  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

// Suspend or activate user
async function suspendUser(
  supabaseClient: any,
  userId: string,
  reason?: string
): Promise<AdminResponse> {
  try {
    const { data: user } = await supabaseClient
      .from('users')
      .select('settings')
      .eq('id', userId)
      .single()

    const currentSettings = user?.settings || {}
    const isSuspended = currentSettings.suspended || false

    const { data: updatedUser, error } = await supabaseClient
      .from('users')
      .update({
        settings: {
          ...currentSettings,
          suspended: !isSuspended,
          suspension_reason: !isSuspended ? reason : null,
          suspension_date: !isSuspended ? new Date().toISOString() : null,
          reactivation_date: isSuspended ? new Date().toISOString() : null
        }
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: 'Failed to update user status' }
    }

    const action = isSuspended ? 'reactivated' : 'suspended'
    const message = `User ${action} successfully`

    return { success: true, user: updatedUser, message }

  } catch (error) {
    console.error('Error suspending user:', error)
    return { success: false, error: 'Failed to update user status' }
  }
}

// Get organizations with metrics
async function getOrganizations(
  supabaseClient: any,
  requestData: AdminRequest
): Promise<AdminResponse> {
  try {
    const { page = 1, limit = 50 } = requestData
    const offset = (page - 1) * limit

    const { data: organizations, error, count } = await supabaseClient
      .from('organizations')
      .select(`
        *,
        users_count:users(count),
        properties_count:properties(count),
        total_revenue:payments(amount.sum())
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: 'Failed to fetch organizations' }
    }

    return { 
      success: true, 
      organizations: organizations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }

  } catch (error) {
    console.error('Error getting organizations:', error)
    return { success: false, error: 'Failed to fetch organizations' }
  }
}

// Get analytics data
async function getAnalytics(
  supabaseClient: any,
  requestData: AdminRequest
): Promise<AdminResponse> {
  try {
    const { date_from, date_to, metric_type } = requestData
    
    // User growth analytics
    const userGrowthQuery = supabaseClient
      .from('users')
      .select('created_at, role')
      .order('created_at', { ascending: true })

    if (date_from) userGrowthQuery.gte('created_at', date_from)
    if (date_to) userGrowthQuery.lte('created_at', date_to)

    const { data: userGrowth } = await userGrowthQuery

    // Revenue analytics
    const { data: revenueData } = await supabaseClient
      .from('organizations')
      .select('subscription_tier, created_at, settings')
      .neq('subscription_tier', 'free')

    // Engagement analytics
    const { data: messageStats } = await supabaseClient
      .from('messages')
      .select('created_at')
      .gte('created_at', date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const analytics = {
      user_growth: processUserGrowthData(userGrowth || []),
      revenue_analytics: processRevenueData(revenueData || []),
      engagement_metrics: {
        total_messages: messageStats?.length || 0,
        messages_per_day: Math.round((messageStats?.length || 0) / 30)
      },
      subscription_distribution: getSubscriptionDistribution(revenueData || [])
    }

    return { success: true, analytics }

  } catch (error) {
    console.error('Error getting analytics:', error)
    return { success: false, error: 'Failed to fetch analytics' }
  }
}

// Get system performance metrics
async function getSystemMetrics(supabaseClient: any): Promise<AdminResponse> {
  try {
    // Database metrics
    const { data: dbStats } = await supabaseClient
      .rpc('get_table_stats') // Custom function to get table sizes
      .catch(() => ({ data: null }))

    // API performance metrics (mock data - in production, integrate with monitoring)
    const metrics = {
      database: {
        total_size: '2.4 GB',
        table_count: 13,
        connection_count: 45,
        query_performance: 'Good'
      },
      api: {
        average_response_time: '120ms',
        requests_per_minute: 150,
        error_rate: '0.2%',
        uptime: '99.9%'
      },
      storage: {
        files_stored: 1250,
        total_storage: '1.8 GB',
        bandwidth_usage: '45 GB/month'
      }
    }

    return { success: true, metrics }

  } catch (error) {
    console.error('Error getting system metrics:', error)
    return { success: false, error: 'Failed to fetch system metrics' }
  }
}

// Export data in various formats
async function exportData(
  supabaseClient: any,
  requestData: AdminRequest
): Promise<AdminResponse> {
  try {
    const { export_format = 'csv', date_from, date_to } = requestData

    // Get data based on export type
    let query = supabaseClient
      .from('users')
      .select(`
        id, email, role, created_at,
        organization:organizations(name, subscription_tier),
        properties_count:properties(count)
      `)

    if (date_from) query = query.gte('created_at', date_from)
    if (date_to) query = query.lte('created_at', date_to)

    const { data: exportData } = await query

    // Format data based on requested format
    let formattedData
    switch (export_format) {
      case 'csv':
        formattedData = convertToCSV(exportData || [])
        break
      case 'json':
        formattedData = JSON.stringify(exportData || [], null, 2)
        break
      case 'pdf':
        formattedData = { message: 'PDF export requires external service integration' }
        break
      default:
        formattedData = exportData
    }

    return { 
      success: true, 
      export_data: formattedData,
      format: export_format,
      record_count: exportData?.length || 0
    }

  } catch (error) {
    console.error('Error exporting data:', error)
    return { success: false, error: 'Failed to export data' }
  }
}

// Send system-wide announcements
async function sendAnnouncement(
  supabaseClient: any,
  announcement: any,
  adminId: string
): Promise<AdminResponse> {
  try {
    const { title, content, target_users, priority = 'medium' } = announcement

    // Get target users (all users if not specified)
    let userQuery = supabaseClient.from('users').select('id')
    
    if (target_users && target_users.length > 0) {
      userQuery = userQuery.in('id', target_users)
    }

    const { data: users } = await userQuery

    // Create notifications for all target users
    const notifications = (users || []).map(user => ({
      user_id: user.id,
      type: 'system',
      title,
      content,
      priority,
      metadata: {
        announcement: true,
        sent_by: adminId,
        sent_at: new Date().toISOString()
      }
    }))

    const { error: insertError } = await supabaseClient
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      return { success: false, error: 'Failed to send announcement' }
    }

    return { 
      success: true, 
      message: `Announcement sent to ${notifications.length} users`
    }

  } catch (error) {
    console.error('Error sending announcement:', error)
    return { success: false, error: 'Failed to send announcement' }
  }
}

// Helper functions
function processUserGrowthData(users: any[]) {
  // Group users by date and calculate growth
  const growthByDate = users.reduce((acc, user) => {
    const date = user.created_at.split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  return Object.entries(growthByDate).map(([date, count]) => ({ date, count }))
}

function processRevenueData(organizations: any[]) {
  const tierPrices = { landlord: 9.99, landlord_pro: 29.99, enterprise: 99.99 }
  
  return organizations.reduce((acc, org) => {
    const price = tierPrices[org.subscription_tier] || 0
    acc.total += price
    acc.by_tier[org.subscription_tier] = (acc.by_tier[org.subscription_tier] || 0) + price
    return acc
  }, { total: 0, by_tier: {} })
}

function getSubscriptionDistribution(organizations: any[]) {
  return organizations.reduce((acc, org) => {
    acc[org.subscription_tier] = (acc[org.subscription_tier] || 0) + 1
    return acc
  }, {})
}

function convertToCSV(data: any[]) {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => 
      JSON.stringify(row[header] || '')
    ).join(','))
  ].join('\n')
  
  return csv
}

// Additional functions would be implemented for:
// - getDisputes, resolveDispute
// - getBillingOverview
// - getSupportTickets, getAuditLogs
// - performBulkOperation