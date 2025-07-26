// Tenesta - Household Management API
// Handles multiple tenants, shared tasks, and split payments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface HouseholdRequest {
  action: 'add_member' | 'remove_member' | 'update_member' | 'list_members' | 
          'create_task' | 'update_task' | 'complete_task' | 'list_tasks' |
          'create_split_payment' | 'update_split_payment' | 'list_split_payments';
  
  // Member fields
  tenancy_id?: string;
  member_email?: string;
  member_id?: string;
  is_primary_tenant?: boolean;
  role_in_household?: string;
  move_in_date?: string;
  
  // Task fields
  task_id?: string;
  task_title?: string;
  task_description?: string;
  task_type?: 'chore' | 'payment' | 'maintenance' | 'other';
  assigned_to?: string;
  due_date?: string;
  recurring_pattern?: any;
  is_completed?: boolean;
  
  // Split payment fields
  payment_id?: string;
  split_amounts?: Array<{
    member_id: string;
    amount: number;
    status?: 'pending' | 'paid' | 'overdue';
  }>;
}

interface HouseholdResponse {
  success: boolean;
  member?: any;
  members?: any[];
  task?: any;
  tasks?: any[];
  split_payment?: any;
  split_payments?: any[];
  error?: string;
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const requestData: HouseholdRequest = await req.json()
    const { action } = requestData

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    let response: HouseholdResponse = { success: false }

    switch (action) {
      case 'add_member':
        response = await addHouseholdMember(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'remove_member':
        response = await removeHouseholdMember(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_member':
        response = await updateHouseholdMember(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'list_members':
        response = await listHouseholdMembers(supabaseClient, user.id, userProfile, requestData.tenancy_id!)
        break
      
      case 'create_task':
        response = await createSharedTask(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_task':
        response = await updateSharedTask(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'complete_task':
        response = await completeSharedTask(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'list_tasks':
        response = await listSharedTasks(supabaseClient, user.id, userProfile, requestData.tenancy_id!)
        break
      
      case 'create_split_payment':
        response = await createSplitPayment(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_split_payment':
        response = await updateSplitPayment(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'list_split_payments':
        response = await listSplitPayments(supabaseClient, user.id, userProfile, requestData.payment_id!)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400,
      }
    )

  } catch (error) {
    console.error('Error in household-management function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Household Member Management
async function addHouseholdMember(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  const { tenancy_id, member_email, is_primary_tenant, role_in_household, move_in_date } = requestData

  if (!tenancy_id || !member_email) {
    return { success: false, error: 'Missing required fields: tenancy_id, member_email' }
  }

  try {
    // Verify user has access to this tenancy
    const { data: tenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .select(`
        *,
        tenant:users!tenancies_tenant_id_fkey (id, email, profile),
        property:properties (
          landlord_id
        )
      `)
      .eq('id', tenancy_id)
      .single()

    if (tenancyError || !tenancy) {
      return { success: false, error: 'Tenancy not found' }
    }

    // Only primary tenant or landlord can add members
    const isPrimaryTenant = tenancy.tenant_id === userId
    const isLandlord = tenancy.property.landlord_id === userId
    
    // Check if current user is already a household member with admin privileges
    const { data: currentMember } = await supabaseClient
      .from('household_members')
      .select('is_primary_tenant')
      .eq('tenancy_id', tenancy_id)
      .eq('user_id', userId)
      .single()

    const isPrimaryMember = currentMember?.is_primary_tenant

    if (!isPrimaryTenant && !isLandlord && !isPrimaryMember) {
      return { success: false, error: 'Only primary tenants or landlords can add household members' }
    }

    // Find the user to add
    const { data: memberUser, error: memberError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', member_email)
      .single()

    if (memberError || !memberUser) {
      return { success: false, error: 'User not found with that email address' }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from('household_members')
      .select('id')
      .eq('tenancy_id', tenancy_id)
      .eq('user_id', memberUser.id)
      .single()

    if (existingMember) {
      return { success: false, error: 'User is already a household member' }
    }

    // Add the household member
    const { data: householdMember, error: memberCreateError } = await supabaseClient
      .from('household_members')
      .insert({
        tenancy_id,
        user_id: memberUser.id,
        is_primary_tenant: is_primary_tenant || false,
        role_in_household,
        move_in_date,
        added_by: userId
      })
      .select(`
        *,
        user:users!household_members_user_id_fkey (id, email, profile),
        added_by_user:users!household_members_added_by_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          property:properties (
            address
          )
        )
      `)
      .single()

    if (memberCreateError) {
      console.error('Error adding household member:', memberCreateError)
      return { success: false, error: 'Failed to add household member' }
    }

    // Send notification to the new member
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: memberUser.id,
        title: 'Added to Household',
        content: `You have been added as a household member at ${tenancy.property.address}`,
        type: 'system',
        priority: 'medium',
        action_url: `/tenancies/${tenancy_id}`,
        metadata: {
          tenancy_id,
          role_in_household,
          added_by: userProfile.profile?.full_name || userProfile.email
        }
      })

    return { success: true, member: householdMember }

  } catch (error) {
    console.error('Error adding household member:', error)
    return { success: false, error: 'Failed to add household member' }
  }
}

async function removeHouseholdMember(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  const { member_id } = requestData

  if (!member_id) {
    return { success: false, error: 'member_id is required' }
  }

  try {
    // Get the household member
    const { data: member, error: memberError } = await supabaseClient
      .from('household_members')
      .select(`
        *,
        tenancy:tenancies (
          tenant_id,
          property:properties (
            landlord_id
          )
        )
      `)
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      return { success: false, error: 'Household member not found' }
    }

    // Only primary tenant, landlord, or the member themselves can remove
    const isPrimaryTenant = member.tenancy.tenant_id === userId
    const isLandlord = member.tenancy.property.landlord_id === userId
    const isSelf = member.user_id === userId

    if (!isPrimaryTenant && !isLandlord && !isSelf) {
      return { success: false, error: 'Access denied' }
    }

    // Cannot remove primary tenant
    if (member.is_primary_tenant && !isLandlord) {
      return { success: false, error: 'Cannot remove primary tenant' }
    }

    // Remove the member
    const { error: deleteError } = await supabaseClient
      .from('household_members')
      .delete()
      .eq('id', member_id)

    if (deleteError) {
      console.error('Error removing household member:', deleteError)
      return { success: false, error: 'Failed to remove household member' }
    }

    // Notify the removed member (if not self-removal)
    if (!isSelf) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: member.user_id,
          title: 'Removed from Household',
          content: 'You have been removed from the household',
          type: 'system',
          priority: 'medium',
          metadata: {
            tenancy_id: member.tenancy_id,
            removed_by: userProfile.profile?.full_name || userProfile.email
          }
        })
    }

    return { success: true }

  } catch (error) {
    console.error('Error removing household member:', error)
    return { success: false, error: 'Failed to remove household member' }
  }
}

async function updateHouseholdMember(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  const { member_id, is_primary_tenant, role_in_household } = requestData

  if (!member_id) {
    return { success: false, error: 'member_id is required' }
  }

  try {
    // Get the household member
    const { data: member, error: memberError } = await supabaseClient
      .from('household_members')
      .select(`
        *,
        tenancy:tenancies (
          tenant_id,
          property:properties (
            landlord_id
          )
        )
      `)
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      return { success: false, error: 'Household member not found' }
    }

    // Only primary tenant or landlord can update member details
    const isPrimaryTenant = member.tenancy.tenant_id === userId
    const isLandlord = member.tenancy.property.landlord_id === userId

    if (!isPrimaryTenant && !isLandlord) {
      return { success: false, error: 'Only primary tenants or landlords can update member details' }
    }

    // Build update object
    const updateData: any = {}
    if (is_primary_tenant !== undefined) updateData.is_primary_tenant = is_primary_tenant
    if (role_in_household) updateData.role_in_household = role_in_household

    const { data: updatedMember, error: updateError } = await supabaseClient
      .from('household_members')
      .update(updateData)
      .eq('id', member_id)
      .select(`
        *,
        user:users!household_members_user_id_fkey (id, email, profile),
        tenancy:tenancies (
          *,
          property:properties (
            address
          )
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating household member:', updateError)
      return { success: false, error: 'Failed to update household member' }
    }

    return { success: true, member: updatedMember }

  } catch (error) {
    console.error('Error updating household member:', error)
    return { success: false, error: 'Failed to update household member' }
  }
}

async function listHouseholdMembers(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  tenancyId: string
): Promise<HouseholdResponse> {
  if (!tenancyId) {
    return { success: false, error: 'tenancy_id is required' }
  }

  try {
    // Verify user has access to this tenancy
    const { data: tenancy, error: tenancyError } = await supabaseClient
      .from('tenancies')
      .select(`
        tenant_id,
        property:properties (
          landlord_id
        )
      `)
      .eq('id', tenancyId)
      .single()

    if (tenancyError || !tenancy) {
      return { success: false, error: 'Tenancy not found' }
    }

    const isPrimaryTenant = tenancy.tenant_id === userId
    const isLandlord = tenancy.property.landlord_id === userId
    
    // Check if user is a household member
    const { data: householdMember } = await supabaseClient
      .from('household_members')
      .select('id')
      .eq('tenancy_id', tenancyId)
      .eq('user_id', userId)
      .single()

    const isHouseholdMember = !!householdMember

    if (!isPrimaryTenant && !isLandlord && !isHouseholdMember) {
      return { success: false, error: 'Access denied' }
    }

    // Get household members
    const { data: members, error: membersError } = await supabaseClient
      .from('household_members')
      .select(`
        *,
        user:users!household_members_user_id_fkey (id, email, profile),
        added_by_user:users!household_members_added_by_fkey (id, email, profile)
      `)
      .eq('tenancy_id', tenancyId)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error listing household members:', membersError)
      return { success: false, error: 'Failed to list household members' }
    }

    return { success: true, members: members || [] }

  } catch (error) {
    console.error('Error listing household members:', error)
    return { success: false, error: 'Failed to list household members' }
  }
}

// Shared Task Management
async function createSharedTask(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  const { tenancy_id, task_title, task_description, task_type, assigned_to, due_date, recurring_pattern } = requestData

  if (!tenancy_id || !task_title || !task_type) {
    return { success: false, error: 'Missing required fields: tenancy_id, task_title, task_type' }
  }

  try {
    // Verify user is part of household
    const hasAccess = await verifyHouseholdAccess(supabaseClient, userId, tenancy_id)
    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    // Create the task
    const { data: task, error: taskError } = await supabaseClient
      .from('shared_tasks')
      .insert({
        tenancy_id,
        created_by: userId,
        title: task_title,
        description: task_description,
        task_type,
        assigned_to,
        due_date,
        recurring_pattern,
        status: 'pending'
      })
      .select(`
        *,
        created_by_user:users!shared_tasks_created_by_fkey (id, email, profile),
        assigned_to_user:users!shared_tasks_assigned_to_fkey (id, email, profile)
      `)
      .single()

    if (taskError) {
      console.error('Error creating shared task:', taskError)
      return { success: false, error: 'Failed to create shared task' }
    }

    // Notify assigned user if different from creator
    if (assigned_to && assigned_to !== userId) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: assigned_to,
          title: 'New Task Assigned',
          content: `You have been assigned a new task: ${task_title}`,
          type: 'system',
          priority: 'medium',
          action_url: `/tasks/${task.id}`,
          metadata: {
            task_id: task.id,
            task_type,
            assigned_by: userProfile.profile?.full_name || userProfile.email
          }
        })
    }

    return { success: true, task }

  } catch (error) {
    console.error('Error creating shared task:', error)
    return { success: false, error: 'Failed to create shared task' }
  }
}

async function updateSharedTask(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  const { task_id, task_title, task_description, assigned_to, due_date, is_completed } = requestData

  if (!task_id) {
    return { success: false, error: 'task_id is required' }
  }

  try {
    // Get the task
    const { data: task, error: taskError } = await supabaseClient
      .from('shared_tasks')
      .select('*')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      return { success: false, error: 'Task not found' }
    }

    // Verify user has access
    const hasAccess = await verifyHouseholdAccess(supabaseClient, userId, task.tenancy_id)
    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    // Build update object
    const updateData: any = {}
    if (task_title) updateData.title = task_title
    if (task_description) updateData.description = task_description
    if (assigned_to) updateData.assigned_to = assigned_to
    if (due_date) updateData.due_date = due_date
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed
      updateData.status = is_completed ? 'completed' : 'pending'
      if (is_completed) updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedTask, error: updateError } = await supabaseClient
      .from('shared_tasks')
      .update(updateData)
      .eq('id', task_id)
      .select(`
        *,
        created_by_user:users!shared_tasks_created_by_fkey (id, email, profile),
        assigned_to_user:users!shared_tasks_assigned_to_fkey (id, email, profile)
      `)
      .single()

    if (updateError) {
      console.error('Error updating shared task:', updateError)
      return { success: false, error: 'Failed to update shared task' }
    }

    return { success: true, task: updatedTask }

  } catch (error) {
    console.error('Error updating shared task:', error)
    return { success: false, error: 'Failed to update shared task' }
  }
}

async function completeSharedTask(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  return await updateSharedTask(supabaseClient, userId, userProfile, {
    ...requestData,
    is_completed: true
  })
}

async function listSharedTasks(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  tenancyId: string
): Promise<HouseholdResponse> {
  if (!tenancyId) {
    return { success: false, error: 'tenancy_id is required' }
  }

  try {
    // Verify user has access
    const hasAccess = await verifyHouseholdAccess(supabaseClient, userId, tenancyId)
    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    // Get tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('shared_tasks')
      .select(`
        *,
        created_by_user:users!shared_tasks_created_by_fkey (id, email, profile),
        assigned_to_user:users!shared_tasks_assigned_to_fkey (id, email, profile)
      `)
      .eq('tenancy_id', tenancyId)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error listing shared tasks:', tasksError)
      return { success: false, error: 'Failed to list shared tasks' }
    }

    return { success: true, tasks: tasks || [] }

  } catch (error) {
    console.error('Error listing shared tasks:', error)
    return { success: false, error: 'Failed to list shared tasks' }
  }
}

// Split Payment Management
async function createSplitPayment(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  const { payment_id, split_amounts } = requestData

  if (!payment_id || !split_amounts || split_amounts.length === 0) {
    return { success: false, error: 'payment_id and split_amounts are required' }
  }

  try {
    // Get the payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        tenancy:tenancies (
          tenant_id,
          property:properties (
            landlord_id
          )
        )
      `)
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return { success: false, error: 'Payment not found' }
    }

    // Verify user has access
    const hasAccess = await verifyHouseholdAccess(supabaseClient, userId, payment.tenancy_id)
    if (!hasAccess) {
      return { success: false, error: 'Access denied' }
    }

    // Validate split amounts total matches payment amount
    const totalSplit = split_amounts.reduce((sum, split) => sum + split.amount, 0)
    if (Math.abs(totalSplit - payment.amount) > 0.01) {
      return { success: false, error: 'Split amounts must equal the total payment amount' }
    }

    // Create split payment records
    const splitPayments = []
    for (const split of split_amounts) {
      const { data: splitPayment, error: splitError } = await supabaseClient
        .from('split_payments')
        .insert({
          payment_id,
          household_member_id: split.member_id,
          amount: split.amount,
          status: split.status || 'pending'
        })
        .select(`
          *,
          household_member:household_members (
            *,
            user:users!household_members_user_id_fkey (id, email, profile)
          )
        `)
        .single()

      if (splitError) {
        console.error('Error creating split payment:', splitError)
        return { success: false, error: 'Failed to create split payment' }
      }

      splitPayments.push(splitPayment)
    }

    return { success: true, split_payments: splitPayments }

  } catch (error) {
    console.error('Error creating split payment:', error)
    return { success: false, error: 'Failed to create split payment' }
  }
}

async function updateSplitPayment(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: HouseholdRequest
): Promise<HouseholdResponse> {
  // Implementation for updating split payment status
  // This would handle marking individual splits as paid
  return { success: false, error: 'Not implemented yet' }
}

async function listSplitPayments(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  paymentId: string
): Promise<HouseholdResponse> {
  if (!paymentId) {
    return { success: false, error: 'payment_id is required' }
  }

  try {
    // Get split payments
    const { data: splitPayments, error: splitError } = await supabaseClient
      .from('split_payments')
      .select(`
        *,
        household_member:household_members (
          *,
          user:users!household_members_user_id_fkey (id, email, profile)
        ),
        payment:payments (
          tenancy_id
        )
      `)
      .eq('payment_id', paymentId)

    if (splitError) {
      console.error('Error listing split payments:', splitError)
      return { success: false, error: 'Failed to list split payments' }
    }

    if (splitPayments.length > 0) {
      // Verify user has access
      const hasAccess = await verifyHouseholdAccess(supabaseClient, userId, splitPayments[0].payment.tenancy_id)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }
    }

    return { success: true, split_payments: splitPayments || [] }

  } catch (error) {
    console.error('Error listing split payments:', error)
    return { success: false, error: 'Failed to list split payments' }
  }
}

// Helper function to verify household access
async function verifyHouseholdAccess(supabaseClient: any, userId: string, tenancyId: string): Promise<boolean> {
  try {
    // Check if user is tenant
    const { data: tenancy } = await supabaseClient
      .from('tenancies')
      .select(`
        tenant_id,
        property:properties (landlord_id)
      `)
      .eq('id', tenancyId)
      .single()

    if (tenancy) {
      // User is tenant or landlord
      if (tenancy.tenant_id === userId || tenancy.property.landlord_id === userId) {
        return true
      }
    }

    // Check if user is household member
    const { data: householdMember } = await supabaseClient
      .from('household_members')
      .select('id')
      .eq('tenancy_id', tenancyId)
      .eq('user_id', userId)
      .single()

    return !!householdMember

  } catch (error) {
    console.error('Error verifying household access:', error)
    return false
  }
}