// Tenesta - Messaging System API
// Handles in-app messages, notifications, and communication between users

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface MessagingRequest {
  action: 'send_message' | 'get_messages' | 'mark_read' | 'create_notification' | 'get_notifications' | 'mark_notification_read' | 'get_conversation'
  // Message fields
  recipient_id?: string
  tenancy_id?: string
  subject?: string
  content?: string
  message_type?: 'rent_reminder' | 'maintenance_request' | 'general' | 'dispute' | 'system'
  message_id?: string
  conversation_id?: string
  // Notification fields
  title?: string
  notification_type?: 'payment_reminder' | 'maintenance_update' | 'dispute_update' | 'system' | 'lease_expiring'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  action_url?: string
  metadata?: Record<string, any>
  notification_id?: string
  // Query parameters
  limit?: number
  offset?: number
  unread_only?: boolean
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

    // Get user profile for role checking
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Profile lookup error:', profileError)
      console.error('Auth user ID:', user.id)
      return new Response(
        JSON.stringify({ 
          error: 'User profile not found',
          details: profileError?.message || 'No profile exists for this auth user',
          auth_user_id: user.id
        }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const requestData: MessagingRequest = await req.json()
    const { action } = requestData

    switch (action) {
      case 'send_message':
        return await handleSendMessage(supabaseClient, userProfile, requestData)
      
      case 'get_messages':
        return await handleGetMessages(supabaseClient, userProfile, requestData)
      
      case 'get_conversation':
        return await handleGetConversation(supabaseClient, userProfile, requestData)
      
      case 'mark_read':
        return await handleMarkMessageRead(supabaseClient, userProfile, requestData)
      
      case 'create_notification':
        return await handleCreateNotification(supabaseClient, userProfile, requestData)
      
      case 'get_notifications':
        return await handleGetNotifications(supabaseClient, userProfile, requestData)
      
      case 'mark_notification_read':
        return await handleMarkNotificationRead(supabaseClient, userProfile, requestData)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...headers, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }

  } catch (error) {
    console.error('Error in messaging-system function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function handleSendMessage(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { recipient_id, tenancy_id, subject, content, message_type = 'general' } = requestData

  if (!recipient_id || !content) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: recipient_id, content' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Verify user has permission to send message
  if (tenancy_id) {
    const hasAccess = await verifyTenancyAccess(supabaseClient, userProfile, tenancy_id)
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this tenancy' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }
  }

  // Verify recipient exists and is accessible
  const canMessage = await canUserMessage(supabaseClient, userProfile, recipient_id, tenancy_id)
  if (!canMessage) {
    return new Response(
      JSON.stringify({ error: 'Cannot send message to this recipient' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  try {
    // Insert message
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        tenancy_id,
        sender_id: userProfile.id,
        recipient_id,
        subject,
        content,
        message_type
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          profile
        ),
        recipient:users!messages_recipient_id_fkey (
          id,
          profile
        )
      `)
      .single()

    if (messageError) {
      console.error('Message insert error:', messageError)
      return new Response(
        JSON.stringify({ error: 'Failed to send message' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Create notification for recipient
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: recipient_id,
        title: 'New Message',
        content: subject ? `New message: ${subject}` : `New message from ${userProfile.profile?.first_name || 'User'}`,
        type: 'message_received',
        priority: 'medium',
        action_url: `/messages/${message.id}`,
        metadata: {
          message_id: message.id,
          sender_id: userProfile.id,
          message_type
        }
      })

    // Send real-time notification
    await supabaseClient.channel('notifications')
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          recipient_id,
          message_id: message.id,
          sender_name: `${userProfile.profile?.first_name || 'User'} ${userProfile.profile?.last_name || ''}`.trim()
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message,
        notification_sent: true
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 201,
      }
    )

  } catch (error) {
    console.error('Send message error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send message' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleGetMessages(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { tenancy_id, unread_only = false, limit = 50, offset = 0 } = requestData

  try {
    let query = supabaseClient
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          profile
        ),
        recipient:users!messages_recipient_id_fkey (
          id,
          profile
        )
      `)
      .or(`sender_id.eq.${userProfile.id},recipient_id.eq.${userProfile.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (tenancy_id) {
      query = query.eq('tenancy_id', tenancy_id)
    }

    if (unread_only) {
      query = query.is('read_at', null).eq('recipient_id', userProfile.id)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('Messages fetch error:', messagesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        messages: messages || [],
        count: messages?.length || 0
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get messages error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch messages' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleGetConversation(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { recipient_id, tenancy_id, limit = 50, offset = 0 } = requestData

  if (!recipient_id) {
    return new Response(
      JSON.stringify({ error: 'Missing recipient_id' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  try {
    let query = supabaseClient
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          profile
        ),
        recipient:users!messages_recipient_id_fkey (
          id,
          profile
        )
      `)
      .or(`and(sender_id.eq.${userProfile.id},recipient_id.eq.${recipient_id}),and(sender_id.eq.${recipient_id},recipient_id.eq.${userProfile.id})`)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (tenancy_id) {
      query = query.eq('tenancy_id', tenancy_id)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('Conversation fetch error:', messagesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch conversation' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversation: messages || [],
        count: messages?.length || 0
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get conversation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch conversation' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleMarkMessageRead(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { message_id } = requestData

  if (!message_id) {
    return new Response(
      JSON.stringify({ error: 'Missing message_id' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  try {
    const { error: updateError } = await supabaseClient
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', message_id)
      .eq('recipient_id', userProfile.id) // Only recipient can mark as read

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to mark message as read' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message marked as read'
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Mark read error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to mark message as read' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleCreateNotification(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { recipient_id, title, content, notification_type = 'system', priority = 'medium', action_url, metadata } = requestData

  if (!recipient_id || !title || !content) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: recipient_id, title, content' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  // Only admins and system can create arbitrary notifications
  if (userProfile.role !== 'admin' && userProfile.role !== 'system') {
    return new Response(
      JSON.stringify({ error: 'Access denied. Only admins can create notifications.' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 403,
      }
    )
  }

  try {
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: recipient_id,
        title,
        content,
        type: notification_type,
        priority,
        action_url,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (notificationError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Send real-time notification
    await supabaseClient.channel('notifications')
      .send({
        type: 'broadcast',
        event: 'new_notification',
        payload: {
          recipient_id,
          notification_id: notification.id,
          title,
          priority
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        notification
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 201,
      }
    )

  } catch (error) {
    console.error('Create notification error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create notification' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleGetNotifications(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { unread_only = false, limit = 50, offset = 0 } = requestData

  try {
    let query = supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unread_only) {
      query = query.eq('read', false)
    }

    const { data: notifications, error: notificationsError } = await query

    if (notificationsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications: notifications || [],
        count: notifications?.length || 0
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get notifications error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch notifications' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

async function handleMarkNotificationRead(supabaseClient: any, userProfile: any, requestData: MessagingRequest) {
  const { notification_id } = requestData

  if (!notification_id) {
    return new Response(
      JSON.stringify({ error: 'Missing notification_id' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  try {
    const { error: updateError } = await supabaseClient
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notification_id)
      .eq('user_id', userProfile.id) // Only owner can mark as read

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to mark notification as read' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification marked as read'
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Mark notification read error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to mark notification as read' }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
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

// Helper function to check if user can message another user
async function canUserMessage(supabaseClient: any, userProfile: any, recipient_id: string, tenancy_id?: string) {
  if (userProfile.role === 'admin') {
    return true // Admins can message anyone
  }

  // Get recipient info
  const { data: recipient, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', recipient_id)
    .single()

  if (error || !recipient) {
    return false
  }

  // Users in same organization can message each other
  if (userProfile.organization_id === recipient.organization_id) {
    return true
  }

  // If tenancy is specified, check if both users have access to it
  if (tenancy_id) {
    const senderAccess = await verifyTenancyAccess(supabaseClient, userProfile, tenancy_id)
    const recipientAccess = await verifyTenancyAccess(supabaseClient, recipient, tenancy_id)
    return senderAccess && recipientAccess
  }

  return false
}