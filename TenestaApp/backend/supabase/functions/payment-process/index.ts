// Tenesta - Payment Processing API
// Handles rent payments, Stripe integration, and payment status updates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface PaymentRequest {
  payment_id: string;
  payment_method_id?: string;
  amount?: number;
  action: 'create_intent' | 'confirm_payment' | 'get_status' | 'mark_paid' | 'schedule_payment';
}

interface PaymentResponse {
  success: boolean;
  payment_intent_id?: string;
  client_secret?: string;
  payment_status?: string;
  error?: string;
  payment_data?: any;
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

    // Parse request body
    const { payment_id, payment_method_id, amount, action }: PaymentRequest = await req.json()

    if (!payment_id || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: payment_id and action' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get payment details and verify user has access
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        tenancy:tenancies (
          *,
          tenant:users!tenancies_tenant_id_fkey (
            id, email, profile
          ),
          property:properties (
            *,
            landlord:users!properties_landlord_id_fkey (
              id, email, profile
            )
          )
        )
      `)
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Verify user has access to this payment (tenant or landlord)
    const isTenant = payment.tenancy.tenant_id === user.id
    const isLandlord = payment.tenancy.property.landlord_id === user.id
    
    if (!isTenant && !isLandlord) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    let response: PaymentResponse = { success: false }

    switch (action) {
      case 'create_intent':
        response = await createPaymentIntent(payment, amount)
        break
      
      case 'confirm_payment':
        if (!payment_method_id) {
          return new Response(
            JSON.stringify({ error: 'payment_method_id required for confirm_payment' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
        response = await confirmPayment(payment, payment_method_id)
        break
      
      case 'get_status':
        response = await getPaymentStatus(payment)
        break
      
      case 'mark_paid':
        // Only landlords can manually mark payments as paid
        if (!isLandlord) {
          return new Response(
            JSON.stringify({ error: 'Only landlords can manually mark payments as paid' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 403,
            }
          )
        }
        response = await markPaymentPaid(supabaseClient, payment)
        break
      
      case 'schedule_payment':
        // Only tenants can schedule payments
        if (!isTenant) {
          return new Response(
            JSON.stringify({ error: 'Only tenants can schedule payments' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 403,
            }
          )
        }
        response = await schedulePayment(payment)
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
    console.error('Error in payment-process function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Stripe integration functions
async function createPaymentIntent(payment: any, customAmount?: number): Promise<PaymentResponse> {
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return { success: false, error: 'Stripe not configured' }
    }

    const amount = customAmount || payment.amount
    const amountInCents = Math.round(amount * 100)

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amountInCents.toString(),
        currency: 'usd',
        automatic_payment_methods: JSON.stringify({ enabled: true }),
        description: `Rent payment for ${payment.tenancy.property.address}`,
        metadata: JSON.stringify({
          payment_id: payment.id,
          tenancy_id: payment.tenancy_id,
          tenant_email: payment.tenancy.tenant.email,
          property_address: payment.tenancy.property.address
        })
      })
    })

    const paymentIntent = await response.json()

    if (!response.ok) {
      console.error('Stripe error:', paymentIntent)
      return { success: false, error: paymentIntent.error?.message || 'Failed to create payment intent' }
    }

    return {
      success: true,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret
    }

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return { success: false, error: 'Failed to create payment intent' }
  }
}

async function confirmPayment(payment: any, paymentMethodId: string): Promise<PaymentResponse> {
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return { success: false, error: 'Stripe not configured' }
    }

    // First create a payment intent if we don't have one
    if (!payment.stripe_payment_intent_id) {
      const intentResult = await createPaymentIntent(payment)
      if (!intentResult.success || !intentResult.payment_intent_id) {
        return intentResult
      }
      payment.stripe_payment_intent_id = intentResult.payment_intent_id
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${payment.stripe_payment_intent_id}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_method: paymentMethodId,
        return_url: `${Deno.env.get('FRONTEND_URL')}/payment/success`
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Stripe confirmation error:', result)
      return { success: false, error: result.error?.message || 'Failed to confirm payment' }
    }

    return {
      success: true,
      payment_status: result.status,
      payment_intent_id: result.id
    }

  } catch (error) {
    console.error('Error confirming payment:', error)
    return { success: false, error: 'Failed to confirm payment' }
  }
}

async function getPaymentStatus(payment: any): Promise<PaymentResponse> {
  try {
    if (!payment.stripe_payment_intent_id) {
      return {
        success: true,
        payment_status: payment.status,
        payment_data: payment
      }
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return { success: false, error: 'Stripe not configured' }
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${payment.stripe_payment_intent_id}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`
      }
    })

    const paymentIntent = await response.json()

    if (!response.ok) {
      console.error('Stripe status error:', paymentIntent)
      return { success: false, error: 'Failed to get payment status' }
    }

    return {
      success: true,
      payment_status: paymentIntent.status,
      payment_data: {
        ...payment,
        stripe_status: paymentIntent.status,
        stripe_data: paymentIntent
      }
    }

  } catch (error) {
    console.error('Error getting payment status:', error)
    return { success: false, error: 'Failed to get payment status' }
  }
}

async function markPaymentPaid(supabaseClient: any, payment: any): Promise<PaymentResponse> {
  try {
    const { data, error } = await supabaseClient
      .from('payments')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: 'manual',
        notes: (payment.notes || '') + ' [Manually marked as paid by landlord]'
      })
      .eq('id', payment.id)
      .select()
      .single()

    if (error) {
      console.error('Error marking payment as paid:', error)
      return { success: false, error: 'Failed to mark payment as paid' }
    }

    // Create notification for tenant
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: payment.tenancy.tenant_id,
        title: 'Payment Confirmed',
        content: `Your payment for ${payment.tenancy.property.address} has been confirmed.`,
        type: 'payment_received',
        priority: 'medium'
      })

    return {
      success: true,
      payment_status: 'paid',
      payment_data: data
    }

  } catch (error) {
    console.error('Error marking payment as paid:', error)
    return { success: false, error: 'Failed to mark payment as paid' }
  }
}

async function schedulePayment(payment: any): Promise<PaymentResponse> {
  // This would integrate with Stripe's scheduled payments or ACH
  // For now, return a placeholder response
  return {
    success: true,
    payment_status: 'scheduled',
    payment_data: payment
  }
}