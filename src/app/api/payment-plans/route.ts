import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

type PublicPaymentPlan = {
  id: string
  name: string
  startingPrice: string
  size: string
  badge: string
  popular: boolean
  projectId: string | null
  features: string[]
}

// Simple in-memory cache (same pattern as /api/hero-slides)
let cache: PublicPaymentPlan[] | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

/** PUBLIC — admin-managed payment plans (src/components/PaymentPlans.tsx). */
export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const plans = await db.paymentPlan.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    })
    const shaped = plans.map((p) => ({
      id: p.id,
      name: p.name,
      startingPrice: p.startingPrice ?? '',
      size: p.size ?? '',
      badge: p.badge ?? '',
      popular: p.popular,
      projectId: p.projectId,
      features: (() => {
        try { const v = JSON.parse(p.features ?? '[]'); return Array.isArray(v) ? v.map(String) : [] }
        catch { return [] }
      })(),
    }))
    cache = shaped
    cacheTime = now
    return NextResponse.json(shaped)
  } catch (error) {
    console.error('Payment plans public GET error:', error)
    // DB unreachable — negative-cache briefly so repeated requests don't
    // each pay the full connect timeout.
    cache = []
    cacheTime = now - CACHE_TTL + 15_000
    return NextResponse.json([], { status: 200 })
  }
}
