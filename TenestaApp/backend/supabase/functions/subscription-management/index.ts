// Tenesta - Subscription Management API
// Handles billing, subscriptions, trials, and plan management with Stripe integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface SubscriptionRequest {
  action: 'get_subscription' | 'create_subscription' | 'update_plan' | 'cancel_subscription' | 
          'start_trial' | 'extend_trial' | 'get_billing_history' | 'create_payment_method' |
          'get_usage' | 'apply_proration' | 'get_plans' | 'upgrade_plan' | 'downgrade_plan'
  
  // Plan management
  plan_id?: string
  new_plan_id?: string
  billing_cycle?: 'monthly' | 'annual'
  
  // Trial management
  trial_days?: number
  trial_type?: 'tenant' | 'landlord' | 'enterprise'
  
  // Payment method
  payment_method_id?: string
  stripe_payment_method?: any
  
  // Billing
  invoice_id?: string
  proration_amount?: number
  effective_date?: string
  
  // Query parameters
  limit?: number
  page?: number
  date_from?: string
  date_to?: string
}

interface SubscriptionResponse {
  success: boolean
  subscription?: any
  billing_history?: any[]
  usage?: any
  plans?: any[]
  trial_info?: any
  payment_methods?: any[]
  invoices?: any[]
  proration?: any
  error?: string
  message?: string
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

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    const requestData: SubscriptionRequest = await req.json()
    let response: SubscriptionResponse

    switch (requestData.action) {
      case 'get_subscription':
        response = await getCurrentSubscription(supabaseClient, user.id, userProfile)
        break
      
      case 'create_subscription':
        response = await createSubscription(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'update_plan':
        response = await updatePlan(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'cancel_subscription':
        response = await cancelSubscription(supabaseClient, user.id, userProfile)
        break
      
      case 'start_trial':
        response = await startTrial(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get_billing_history':
        response = await getBillingHistory(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'get_usage':
        response = await getUsageMetrics(supabaseClient, user.id, userProfile)
        break
      
      case 'get_plans':
        response = await getAvailablePlans(supabaseClient, userProfile)
        break
      
      case 'upgrade_plan':
        response = await upgradePlan(supabaseClient, user.id, userProfile, requestData)
        break
      
      case 'downgrade_plan':
        response = await downgradePlan(supabaseClient, user.id, userProfile, requestData)
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
    console.error('Subscription management error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Get current subscription status
async function getCurrentSubscription(
  supabaseClient: any,
  userId: string,
  userProfile: any
): Promise<SubscriptionResponse> {
  try {
    // Get subscription from organization
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('id', userProfile.organization_id)
      .single()

    if (orgError) {
      return { success: false, error: 'Organization not found' }
    }

    // Get trial information
    const settings = org.settings || {}
    const trialInfo = {
      is_trial: settings.trial_active || false,
      trial_start: settings.trial_start_date,
      trial_end: settings.trial_end_date,
      trial_days_remaining: settings.trial_active ? 
        Math.max(0, Math.ceil((new Date(settings.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0
    }

    const subscription = {
      id: org.id,
      plan: org.subscription_tier,
      status: trialInfo.is_trial ? 'trial' : 'active',
      billing_cycle: settings.billing_cycle || 'monthly',
      current_period_start: settings.current_period_start,
      current_period_end: settings.current_period_end,
      stripe_subscription_id: settings.stripe_subscription_id,
      trial_info: trialInfo
    }

    return { success: true, subscription, trial_info: trialInfo }

  } catch (error) {
    console.error('Error getting subscription:', error)
    return { success: false, error: 'Failed to get subscription' }
  }
}

// Create new subscription
async function createSubscription(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SubscriptionRequest
): Promise<SubscriptionResponse> {
  try {
    const { plan_id, billing_cycle = 'monthly', payment_method_id } = requestData

    if (!plan_id || !payment_method_id) {
      return { success: false, error: 'Plan ID and payment method required' }
    }

    // Update organization subscription
    const { data: updatedOrg, error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        subscription_tier: plan_id,
        settings: {
          billing_cycle,
          stripe_payment_method_id: payment_method_id,
          subscription_start_date: new Date().toISOString(),
          trial_active: false
        }
      })
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to create subscription' }
    }

    // TODO: Create Stripe subscription here
    // const stripeSubscription = await createStripeSubscription(plan_id, payment_method_id)

    return { 
      success: true, 
      subscription: updatedOrg,
      message: 'Subscription created successfully' 
    }

  } catch (error) {
    console.error('Error creating subscription:', error)
    return { success: false, error: 'Failed to create subscription' }
  }
}

// Start trial period
async function startTrial(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SubscriptionRequest
): Promise<SubscriptionResponse> {
  try {
    const { trial_type = 'tenant', trial_days } = requestData

    // Define trial periods based on PRD
    const trialPeriods = {
      tenant: 14,
      landlord: 30,
      enterprise: 60
    }

    const days = trial_days || trialPeriods[trial_type] || 14
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + (days * 24 * 60 * 60 * 1000))

    // Update organization with trial info
    const { data: updatedOrg, error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        subscription_tier: 'free',
        settings: {
          trial_active: true,
          trial_start_date: trialStart.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          trial_type,
          trial_days: days
        }
      })
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to start trial' }
    }

    const trialInfo = {
      is_trial: true,
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      trial_days_remaining: days,
      trial_type
    }

    return { 
      success: true, 
      trial_info: trialInfo,
      message: `${days}-day trial started successfully` 
    }

  } catch (error) {
    console.error('Error starting trial:', error)
    return { success: false, error: 'Failed to start trial' }
  }
}

// Get available plans
async function getAvailablePlans(
  supabaseClient: any,
  userProfile: any
): Promise<SubscriptionResponse> {
  try {
    // Define plans based on PRD requirements
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        billing_cycle: 'monthly',
        features: [
          'Basic rent tracking',
          'Document storage (5 documents)',
          'Basic messaging',
          'Mobile app access'
        ],
        limits: {
          properties: 1,
          documents: 5,
          messages_per_month: 50
        }
      },
      {
        id: 'landlord',
        name: 'Landlord',
        price: 9.99,
        billing_cycle: 'monthly',
        features: [
          'Up to 10 properties',
          'Unlimited documents',
          'Advanced reporting',
          'Payment processing',
          'Tenant screening'
        ],
        limits: {
          properties: 10,
          documents: -1, // unlimited
          messages_per_month: -1
        }
      },
      {
        id: 'landlord_pro',
        name: 'Landlord Pro',
        price: 29.99,
        billing_cycle: 'monthly',
        features: [
          'Unlimited properties',
          'AI-powered features',
          'Advanced analytics',
          'Priority support',
          'API access',
          'White-label options'
        ],
        limits: {
          properties: -1,
          documents: -1,
          messages_per_month: -1
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99.99,
        billing_cycle: 'monthly',
        features: [
          'Everything in Pro',
          'Custom onboarding',
          'Dedicated support',
          'Advanced integrations',
          'Custom reporting',
          'SSO support'
        ],
        limits: {
          properties: -1,
          documents: -1,
          messages_per_month: -1
        }
      }
    ]

    return { success: true, plans }

  } catch (error) {
    console.error('Error getting plans:', error)
    return { success: false, error: 'Failed to get plans' }
  }
}

// Upgrade plan
async function upgradePlan(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SubscriptionRequest
): Promise<SubscriptionResponse> {
  try {
    const { new_plan_id, effective_date } = requestData

    if (!new_plan_id) {
      return { success: false, error: 'New plan ID required' }
    }

    // Get current subscription
    const current = await getCurrentSubscription(supabaseClient, userId, userProfile)
    if (!current.success || !current.subscription) {
      return { success: false, error: 'No current subscription found' }
    }

    // Calculate proration if needed
    let prorationAmount = 0
    if (effective_date) {
      // TODO: Calculate proration based on remaining days and price difference
      prorationAmount = calculateProration(current.subscription.plan, new_plan_id, effective_date)
    }

    // Update subscription
    const { data: updatedOrg, error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        subscription_tier: new_plan_id,
        settings: {
          ...current.subscription.settings,
          plan_upgraded_date: new Date().toISOString(),
          previous_plan: current.subscription.plan,
          proration_applied: prorationAmount
        }
      })
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to upgrade plan' }
    }

    return { 
      success: true, 
      subscription: updatedOrg,
      proration: { amount: prorationAmount },
      message: 'Plan upgraded successfully' 
    }

  } catch (error) {
    console.error('Error upgrading plan:', error)
    return { success: false, error: 'Failed to upgrade plan' }
  }
}

// Helper function to calculate proration
function calculateProration(currentPlan: string, newPlan: string, effectiveDate: string): number {
  // Simplified proration calculation
  // In production, this would integrate with Stripe's proration logic
  const planPrices = {
    free: 0,
    landlord: 9.99,
    landlord_pro: 29.99,
    enterprise: 99.99
  }

  const currentPrice = planPrices[currentPlan] || 0
  const newPrice = planPrices[newPlan] || 0
  const priceDifference = newPrice - currentPrice

  // Calculate remaining days in billing cycle
  const now = new Date()
  const effectiveDateTime = new Date(effectiveDate)
  const daysRemaining = Math.max(0, Math.ceil((effectiveDateTime - now) / (1000 * 60 * 60 * 24)))
  
  // Pro-rate based on remaining days (assuming 30-day cycle)
  return Math.round((priceDifference * daysRemaining / 30) * 100) / 100
}

// Get billing history
async function getBillingHistory(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SubscriptionRequest
): Promise<SubscriptionResponse> {
  try {
    // For now, return mock billing history
    // In production, this would query actual billing records or Stripe
    const billingHistory = [
      {
        id: 'inv_001',
        date: '2024-07-01',
        description: 'Landlord Plan - Monthly',
        amount: 9.99,
        status: 'paid',
        invoice_url: '#'
      },
      {
        id: 'inv_002', 
        date: '2024-06-01',
        description: 'Landlord Plan - Monthly',
        amount: 9.99,
        status: 'paid',
        invoice_url: '#'
      }
    ]

    return { success: true, billing_history: billingHistory }

  } catch (error) {
    console.error('Error getting billing history:', error)
    return { success: false, error: 'Failed to get billing history' }
  }
}

// Get usage metrics
async function getUsageMetrics(
  supabaseClient: any,
  userId: string,
  userProfile: any
): Promise<SubscriptionResponse> {
  try {
    // Get usage statistics
    const { data: propertiesCount } = await supabaseClient
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('landlord_id', userProfile.id)

    const { data: documentsCount } = await supabaseClient
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('uploader_id', userProfile.id)

    const { data: messagesCount } = await supabaseClient
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('sender_id', userProfile.id)
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())

    const usage = {
      properties_used: propertiesCount?.length || 0,
      documents_used: documentsCount?.length || 0,
      messages_this_month: messagesCount?.length || 0,
      last_updated: new Date().toISOString()
    }

    return { success: true, usage }

  } catch (error) {
    console.error('Error getting usage metrics:', error)
    return { success: false, error: 'Failed to get usage metrics' }
  }
}

// Cancel subscription
async function cancelSubscription(
  supabaseClient: any,
  userId: string,
  userProfile: any
): Promise<SubscriptionResponse> {
  try {
    // Update organization to free tier
    const { data: updatedOrg, error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        subscription_tier: 'free',
        settings: {
          subscription_cancelled_date: new Date().toISOString(),
          cancellation_reason: 'user_requested'
        }
      })
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to cancel subscription' }
    }

    // TODO: Cancel Stripe subscription
    // await cancelStripeSubscription(subscriptionId)

    return { 
      success: true, 
      subscription: updatedOrg,
      message: 'Subscription cancelled successfully' 
    }

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

// Update plan (generic plan change)
async function updatePlan(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SubscriptionRequest
): Promise<SubscriptionResponse> {
  try {
    const { new_plan_id, billing_cycle } = requestData

    if (!new_plan_id) {
      return { success: false, error: 'New plan ID required' }
    }

    // Update organization
    const updateData: any = { subscription_tier: new_plan_id }
    if (billing_cycle) {
      updateData.settings = { billing_cycle }
    }

    const { data: updatedOrg, error: updateError } = await supabaseClient
      .from('organizations')
      .update(updateData)
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to update plan' }
    }

    return { 
      success: true, 
      subscription: updatedOrg,
      message: 'Plan updated successfully' 
    }

  } catch (error) {
    console.error('Error updating plan:', error)
    return { success: false, error: 'Failed to update plan' }
  }
}

// Downgrade plan
async function downgradePlan(
  supabaseClient: any,
  userId: string,
  userProfile: any,
  requestData: SubscriptionRequest
): Promise<SubscriptionResponse> {
  try {
    const { new_plan_id } = requestData

    if (!new_plan_id) {
      return { success: false, error: 'New plan ID required' }
    }

    // Get current subscription
    const current = await getCurrentSubscription(supabaseClient, userId, userProfile)
    if (!current.success || !current.subscription) {
      return { success: false, error: 'No current subscription found' }
    }

    // Check for data that might be lost in downgrade
    const usage = await getUsageMetrics(supabaseClient, userId, userProfile)
    const warningsResponse = checkDowngradeWarnings(usage.usage, new_plan_id)

    // Update subscription
    const { data: updatedOrg, error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        subscription_tier: new_plan_id,
        settings: {
          ...current.subscription.settings,
          plan_downgraded_date: new Date().toISOString(),
          previous_plan: current.subscription.plan,
          downgrade_warnings: warningsResponse.warnings
        }
      })
      .eq('id', userProfile.organization_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to downgrade plan' }
    }

    return { 
      success: true, 
      subscription: updatedOrg,
      message: 'Plan downgraded successfully',
      ...warningsResponse
    }

  } catch (error) {
    console.error('Error downgrading plan:', error)
    return { success: false, error: 'Failed to downgrade plan' }
  }
}

// Check for potential data loss warnings when downgrading
function checkDowngradeWarnings(usage: any, newPlanId: string) {
  const planLimits = {
    free: { properties: 1, documents: 5 },
    landlord: { properties: 10, documents: -1 },
    landlord_pro: { properties: -1, documents: -1 },
    enterprise: { properties: -1, documents: -1 }
  }

  const newLimits = planLimits[newPlanId]
  const warnings = []

  if (newLimits.properties !== -1 && usage.properties_used > newLimits.properties) {
    warnings.push(`You currently have ${usage.properties_used} properties, but the ${newPlanId} plan only allows ${newLimits.properties}. Some properties may become read-only.`)
  }

  if (newLimits.documents !== -1 && usage.documents_used > newLimits.documents) {
    warnings.push(`You currently have ${usage.documents_used} documents, but the ${newPlanId} plan only allows ${newLimits.documents}. Some documents may become inaccessible.`)
  }

  return { warnings }
}