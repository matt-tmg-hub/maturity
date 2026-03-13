// lib/subscription.ts
// Subscription status helper - Section 6.4 of Master Guide

export interface SubscriptionStatus {
  hasAccess: boolean
  planType: 'annual' | 'onetime' | null
  subscription: SubscriptionRecord | null
  isExpiringSoon?: boolean
  daysUntilExpiry?: number
}

export interface SubscriptionRecord {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_payment_intent: string | null
  plan_type: 'annual' | 'onetime'
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  current_period_start: string | null
  current_period_end: string | null
  assessments_used: number
  assessments_limit: number | null
  created_at: string
  updated_at: string
}

export async function getUserSubscriptionStatus(
  supabase: any,
  userId: string
): Promise<SubscriptionStatus> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return { hasAccess: false, planType: null, subscription: null }
  }

  // Annual: check expiry date
  if (data.plan_type === 'annual') {
    const hasExpiry = !!data.current_period_end
    const expiry = hasExpiry ? new Date(data.current_period_end) : null
    const notExpired = !expiry || expiry > new Date()

    // Check if expiring within 7 days
    let isExpiringSoon = false
    let daysUntilExpiry: number | undefined
    if (expiry) {
      const msLeft = expiry.getTime() - Date.now()
      daysUntilExpiry = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
      isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0
    }

    return {
      hasAccess: notExpired,
      planType: 'annual',
      subscription: data,
      isExpiringSoon,
      daysUntilExpiry,
    }
  }

  // One-time: check usage limit
  if (data.plan_type === 'onetime') {
    const limit = data.assessments_limit ?? 1
    const hasRemaining = data.assessments_used < limit

    return {
      hasAccess: hasRemaining,
      planType: 'onetime',
      subscription: data,
    }
  }

  return { hasAccess: false, planType: null, subscription: null }
}

// Helper to check if a user can start a NEW assessment
// (separate from hasAccess which just checks subscription validity)
export async function canStartAssessment(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getUserSubscriptionStatus(supabase, userId)

  if (!status.hasAccess) {
    if (!status.subscription) {
      return { allowed: false, reason: 'no_subscription' }
    }
    if (
      status.planType === 'onetime' &&
      status.subscription.assessments_used >= (status.subscription.assessments_limit ?? 1)
    ) {
      return { allowed: false, reason: 'onetime_used' }
    }
    if (
      status.planType === 'annual' &&
      status.subscription.current_period_end &&
      new Date(status.subscription.current_period_end) <= new Date()
    ) {
      return { allowed: false, reason: 'subscription_expired' }
    }
    return { allowed: false, reason: 'inactive' }
  }

  return { allowed: true }
}
