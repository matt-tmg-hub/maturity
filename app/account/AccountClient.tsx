'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AccountClient({ user, subscription }: { user: any; subscription: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const planLabel =
    subscription?.plan_type === 'annual'
      ? 'Annual Subscription'
      : subscription?.plan_type === 'onetime'
      ? 'Single Assessment'
      : 'No active plan'

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const assessmentsUsed = subscription?.assessments_used ?? 0
  const assessmentsLimit = subscription?.assessments_limit

  const handleManageBilling = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not open billing portal. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account</h1>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Account Info
          </h2>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between py-3">
              <span className="text-gray-500 text-sm">Email</span>
              <span className="text-gray-900 text-sm font-medium">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Subscription
          </h2>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between py-3">
              <span className="text-gray-500 text-sm">Plan</span>
              <span className="text-gray-900 text-sm font-medium">{planLabel}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-500 text-sm">Status</span>
              <span
                className={`text-sm font-semibold capitalize px-2 py-0.5 rounded-full ${
                  subscription?.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {subscription?.status ?? 'None'}
              </span>
            </div>
            {renewalDate && (
              <div className="flex justify-between py-3">
                <span className="text-gray-500 text-sm">Renews</span>
                <span className="text-gray-900 text-sm font-medium">{renewalDate}</span>
              </div>
            )}
            {subscription?.plan_type === 'onetime' && (
              <div className="flex justify-between py-3">
                <span className="text-gray-500 text-sm">Assessments Used</span>
                <span className="text-gray-900 text-sm font-medium">
                  {assessmentsUsed} of {assessmentsLimit ?? 1}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Manage Billing Button */}
        {subscription?.stripe_customer_id ? (
          <>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="w-full bg-[#0f1e3d] text-white py-3 rounded-lg font-medium hover:bg-[#1a2f5e] transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Redirecting to billing...' : 'Manage Billing & Subscription'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Update payment method, cancel, or view invoices
            </p>
          </>
        ) : (
          <div className="text-center text-sm text-gray-400 mt-4">
            No billing account found.{' '}
            <Link href="/pricing" className="text-blue-600 hover:underline">
              View plans
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
