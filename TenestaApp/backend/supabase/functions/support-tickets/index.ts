// Tenesta - Support Ticket Management API
// Handles customer support tickets and conversations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SupportRequest {
  action: 'create_ticket' | 'update_ticket' | 'get_ticket' | 'list_tickets' | 
          'add_message' | 'get_messages' | 'close_ticket' | 'reopen_ticket';
  
  // Ticket fields
  ticket_id?: string;
  ticket_number?: string;
  subject?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'pending' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  
  // Message fields
  message_content?: string;
  is_internal?: boolean;
  attachments?: string[];
  
  // Filtering and pagination
  filter_status?: string[];
  filter_category?: string[];
  filter_priority?: string[];
  assigned_to?: string;
  page?: number;
  limit?: number;
}

interface SupportResponse {
  success: boolean;
  ticket?: any;
  tickets?: any[];
  message?: any;
  messages?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
  error?: string;
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

    const requestData: SupportRequest = await req.json()
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

    let response: SupportResponse = { success: false }

    switch (action) {
      case 'create_ticket':
        response = await createSupportTicket(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_ticket':
        response = await updateSupportTicket(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get_ticket':
        response = await getSupportTicket(supabaseClient, user.id, userProfile, requestData.ticket_id!)
        break
      
      case 'list_tickets':
        response = await listSupportTickets(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'add_message':
        response = await addTicketMessage(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get_messages':
        response = await getTicketMessages(supabaseClient, user.id, userProfile, requestData.ticket_id!)
        break
      
      case 'close_ticket':
        response = await closeTicket(supabaseClient, user.id, userProfile, requestData.ticket_id!)
        break
      
      case 'reopen_ticket':
        response = await reopenTicket(supabaseClient, user.id, userProfile, requestData.ticket_id!)
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
    console.error('Error in support-tickets function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function createSupportTicket(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SupportRequest
): Promise<SupportResponse> {
  const { subject, description, category, priority } = requestData

  if (!subject || !description) {
    return { success: false, error: 'Missing required fields: subject, description' }
  }

  try {
    // Generate ticket number
    const { data: ticketNumber, error: numberError } = await supabaseClient
      .rpc('generate_ticket_number')

    if (numberError) {
      console.error('Error generating ticket number:', numberError)
      return { success: false, error: 'Failed to generate ticket number' }
    }

    // Create the support ticket
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: userId,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        organization_id: userProfile.organization_id
      })
      .select(`
        *,
        user:users!support_tickets_user_id_fkey (id, email, profile),
        assigned_to_user:users!support_tickets_assigned_to_fkey (id, email, profile),
        organization:organizations (id, name)
      `)
      .single()

    if (ticketError) {
      console.error('Error creating support ticket:', ticketError)
      return { success: false, error: 'Failed to create support ticket' }
    }

    // Create initial message with the description
    await supabaseClient
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: userId,
        content: description,
        is_internal: false
      })

    // Send notification to support team (you would configure this based on your setup)
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Support Ticket Created',
        content: `Your support ticket #${ticketNumber} has been created. We'll respond within 24 hours.`,
        type: 'system',
        priority: 'medium',
        action_url: `/support/tickets/${ticket.id}`,
        metadata: {
          ticket_id: ticket.id,
          ticket_number: ticketNumber,
          category,
          priority
        }
      })

    // TODO: Also notify support team members (would need support team role/assignment logic)

    return { success: true, ticket }

  } catch (error) {
    console.error('Error creating support ticket:', error)
    return { success: false, error: 'Failed to create support ticket' }
  }
}

async function updateSupportTicket(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SupportRequest
): Promise<SupportResponse> {
  const { ticket_id, category, priority, status, assigned_to } = requestData

  if (!ticket_id) {
    return { success: false, error: 'ticket_id is required' }
  }

  try {
    // Get the ticket and verify access
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return { success: false, error: 'Support ticket not found' }
    }

    // Check access - user owns ticket or is support staff/admin
    const isOwner = ticket.user_id === userId
    const isSupport = userProfile.role === 'admin' || userProfile.role === 'support'
    const isAssigned = ticket.assigned_to === userId

    if (!isOwner && !isSupport && !isAssigned) {
      return { success: false, error: 'Access denied' }
    }

    // Build update object based on permissions
    const updateData: any = {}
    
    // Customers can update category and priority if ticket is open
    if (isOwner && ticket.status === 'open') {
      if (category) updateData.category = category
      if (priority) updateData.priority = priority
    }
    
    // Support staff can update all fields
    if (isSupport) {
      if (category) updateData.category = category
      if (priority) updateData.priority = priority
      if (status) updateData.status = status
      if (assigned_to) updateData.assigned_to = assigned_to
    }

    // Assigned staff can update status
    if (isAssigned) {
      if (status) updateData.status = status
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No valid updates provided' }
    }

    const { data: updatedTicket, error: updateError } = await supabaseClient
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticket_id)
      .select(`
        *,
        user:users!support_tickets_user_id_fkey (id, email, profile),
        assigned_to_user:users!support_tickets_assigned_to_fkey (id, email, profile),
        organization:organizations (id, name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating support ticket:', updateError)
      return { success: false, error: 'Failed to update support ticket' }
    }

    // Send notification about status change if applicable
    if (updateData.status && updateData.status !== ticket.status) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: ticket.user_id,
          title: 'Support Ticket Updated',
          content: `Your support ticket #${ticket.ticket_number} status has been updated to: ${updateData.status}`,
          type: 'system',
          priority: 'medium',
          action_url: `/support/tickets/${ticket_id}`,
          metadata: {
            ticket_id,
            old_status: ticket.status,
            new_status: updateData.status,
            updated_by_role: userProfile.role
          }
        })
    }

    return { success: true, ticket: updatedTicket }

  } catch (error) {
    console.error('Error updating support ticket:', error)
    return { success: false, error: 'Failed to update support ticket' }
  }
}

async function getSupportTicket(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  ticketId: string
): Promise<SupportResponse> {
  if (!ticketId) {
    return { success: false, error: 'ticket_id is required' }
  }

  try {
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('support_tickets')
      .select(`
        *,
        user:users!support_tickets_user_id_fkey (id, email, profile),
        assigned_to_user:users!support_tickets_assigned_to_fkey (id, email, profile),
        organization:organizations (id, name)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return { success: false, error: 'Support ticket not found' }
    }

    // Check access
    const isOwner = ticket.user_id === userId
    const isSupport = userProfile.role === 'admin' || userProfile.role === 'support'
    const isAssigned = ticket.assigned_to === userId
    const sameOrganization = ticket.organization_id === userProfile.organization_id

    if (!isOwner && !isSupport && !isAssigned && !sameOrganization) {
      return { success: false, error: 'Access denied' }
    }

    return { success: true, ticket }

  } catch (error) {
    console.error('Error getting support ticket:', error)
    return { success: false, error: 'Failed to get support ticket' }
  }
}

async function listSupportTickets(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SupportRequest
): Promise<SupportResponse> {
  try {
    const page = requestData.page || 1
    const limit = requestData.limit || 20
    const offset = (page - 1) * limit

    let query = supabaseClient
      .from('support_tickets')
      .select(`
        *,
        user:users!support_tickets_user_id_fkey (id, email, profile),
        assigned_to_user:users!support_tickets_assigned_to_fkey (id, email, profile),
        organization:organizations (id, name)
      `, { count: 'exact' })

    // Filter based on user role
    if (userProfile.role === 'admin' || userProfile.role === 'support') {
      // Support staff can see all tickets, optionally filtered by assignment
      if (requestData.assigned_to) {
        query = query.eq('assigned_to', requestData.assigned_to)
      }
    } else {
      // Regular users can only see their own tickets
      query = query.eq('user_id', userId)
    }

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

    const { data: tickets, error: ticketsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ticketsError) {
      console.error('Error listing support tickets:', ticketsError)
      return { success: false, error: 'Failed to list support tickets' }
    }

    const pagination = {
      page,
      limit,
      total: count || 0,
      has_more: (count || 0) > offset + limit
    }

    return { success: true, tickets: tickets || [], pagination }

  } catch (error) {
    console.error('Error listing support tickets:', error)
    return { success: false, error: 'Failed to list support tickets' }
  }
}

async function addTicketMessage(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SupportRequest
): Promise<SupportResponse> {
  const { ticket_id, message_content, is_internal, attachments } = requestData

  if (!ticket_id || !message_content) {
    return { success: false, error: 'ticket_id and message_content are required' }
  }

  try {
    // Get the ticket and verify access
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('support_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return { success: false, error: 'Support ticket not found' }
    }

    // Check access
    const isOwner = ticket.user_id === userId
    const isSupport = userProfile.role === 'admin' || userProfile.role === 'support'
    const isAssigned = ticket.assigned_to === userId

    if (!isOwner && !isSupport && !isAssigned) {
      return { success: false, error: 'Access denied' }
    }

    // Only support staff can create internal messages
    const messageIsInternal = is_internal && isSupport

    // Create the message
    const { data: message, error: messageError } = await supabaseClient
      .from('support_messages')
      .insert({
        ticket_id,
        sender_id: userId,
        content: message_content,
        is_internal: messageIsInternal,
        attachments: attachments || []
      })
      .select(`
        *,
        sender:users!support_messages_sender_id_fkey (id, email, profile)
      `)
      .single()

    if (messageError) {
      console.error('Error adding ticket message:', messageError)
      return { success: false, error: 'Failed to add message' }
    }

    // Update ticket status if customer is responding
    if (isOwner && ticket.status === 'waiting_for_customer') {
      await supabaseClient
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticket_id)
    }

    // Update last activity
    await supabaseClient
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket_id)

    // Send notification to the other party (if not internal message)
    if (!messageIsInternal) {
      const notifyUserId = isOwner ? ticket.assigned_to : ticket.user_id
      if (notifyUserId && notifyUserId !== userId) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: notifyUserId,
            title: 'New Message on Support Ticket',
            content: `New message on support ticket #${ticket.ticket_number}`,
            type: 'system',
            priority: 'medium',
            action_url: `/support/tickets/${ticket_id}`,
            metadata: {
              ticket_id,
              ticket_number: ticket.ticket_number,
              sender_role: userProfile.role
            }
          })
      }
    }

    return { success: true, message }

  } catch (error) {
    console.error('Error adding ticket message:', error)
    return { success: false, error: 'Failed to add message' }
  }
}

async function getTicketMessages(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  ticketId: string
): Promise<SupportResponse> {
  if (!ticketId) {
    return { success: false, error: 'ticket_id is required' }
  }

  try {
    // First verify access to the ticket
    const ticketResponse = await getSupportTicket(supabaseClient, userId, userProfile, ticketId)
    if (!ticketResponse.success) {
      return ticketResponse
    }

    // Get messages, filtering out internal messages for non-support users
    const isSupport = userProfile.role === 'admin' || userProfile.role === 'support'
    
    let query = supabaseClient
      .from('support_messages')
      .select(`
        *,
        sender:users!support_messages_sender_id_fkey (id, email, profile)
      `)
      .eq('ticket_id', ticketId)

    // Hide internal messages from non-support users
    if (!isSupport) {
      query = query.eq('is_internal', false)
    }

    const { data: messages, error: messagesError } = await query
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error getting ticket messages:', messagesError)
      return { success: false, error: 'Failed to get messages' }
    }

    return { success: true, messages: messages || [] }

  } catch (error) {
    console.error('Error getting ticket messages:', error)
    return { success: false, error: 'Failed to get messages' }
  }
}

async function closeTicket(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  ticketId: string
): Promise<SupportResponse> {
  return await updateSupportTicket(supabaseClient, userId, userProfile, {
    action: 'update_ticket',
    ticket_id: ticketId,
    status: 'closed'
  })
}

async function reopenTicket(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  ticketId: string
): Promise<SupportResponse> {
  return await updateSupportTicket(supabaseClient, userId, userProfile, {
    action: 'update_ticket',
    ticket_id: ticketId,
    status: 'open'
  })
}