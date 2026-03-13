import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPeriodEnd(sub: any): string | null {
  if (sub?.current_period_end) {
    return new Date(sub.current_period_end * 1000).toISOString()
  }
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    console.error('[stripe-webhook] signature error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = getServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const planType = session.metadata?.plan_type as 'annual' | 'onetime'

        if (!userId || !planType) {
          console.error('[stripe-webhook] Missing metadata on session', session.id)
          break
        }

        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

        if (planType === 'onetime' && (session.payment_status === 'paid' || session.payment_status === 'no_payment_needed')) {
          const { error } = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: null,
              plan_type: 'onetime',
              status: 'active',
              assessments_limit: 1,
              assessments_used: 0,
              current_period_end: null,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          if (error) console.error('[stripe-webhook] upsert onetime error:', error)
        }

        if (planType === 'annual' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub: any = await stripe.subscriptions.retrieve(subscriptionId)

          const { error } = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_type: 'annual',
              status: 'active',
              assessments_limit: null,
              assessments_used: 0,
              current_period_end: getPeriodEnd(sub),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          if (error) console.error('[stripe-webhook] upsert annual error:', error)
        }

        break
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub: any = event.data.object
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: sub.status === 'active' ? 'active' : 'expired',
            current_period_end: getPeriodEnd(sub),
          })
          .eq('stripe_subscription_id', sub.id)
        if (error) console.error('[stripe-webhook] update subscription error:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)
        if (error) console.error('[stripe-webhook] cancel subscription error:', error)
        break
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
