import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { planType, promoCode } = body

    if (!planType || !['annual', 'onetime'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://buildermaturity.com'

    const { data: existingSub } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
    let customerId: string | undefined = existingSub?.stripe_customer_id ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })
      customerId = customer.id
    }

    const isAnnual = planType === 'annual'
    const priceId = isAnnual ? process.env.STRIPE_ANNUAL_PRICE_ID! : process.env.STRIPE_ONETIME_PRICE_ID!

    let discounts: Stripe.Checkout.SessionCreateParams['discounts'] = undefined
    if (promoCode && promoCode.trim()) {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode.trim().toUpperCase(), active: true, limit: 1 })
      if (promoCodes.data.length > 0) {
        discounts = [{ promotion_code: promoCodes.data[0].id }]
      } else {
        return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 })
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isAnnual ? 'subscription' : 'payment',
      success_url: `${appUrl}/dashboard?payment=success&plan=${planType}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      metadata: { supabase_user_id: user.id, plan_type: planType },
      ...(discounts && { discounts }),
      payment_method_collection: 'if_required',
      ...(isAnnual && { subscription_data: { metadata: { supabase_user_id: user.id, plan_type: planType } } }),
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[create-checkout] error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}