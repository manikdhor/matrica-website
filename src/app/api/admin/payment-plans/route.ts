import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

/** Normalize an incoming `features` value to a JSON string array (or null). */
function normalizeFeatures(features: unknown): string | null | undefined {
  if (features === undefined) return undefined
  if (features === null) return null
  if (Array.isArray(features)) return JSON.stringify(features.map((f) => String(f)))
  // Already a JSON string — store as-is
  return String(features)
}

export async function GET() {
  const auth = await requirePermission('projects', false)
  if (auth instanceof Response) return auth
  try {
    const plans = await db.paymentPlan.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Payment plans GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('projects', true)
  if (auth instanceof Response) return auth
  try {
    const { name, startingPrice, size, features, badge, popular, enabled, sortOrder, projectId } = await request.json()
    if (!name || !String(name).trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const plan = await db.paymentPlan.create({
      data: {
        name: String(name).trim(),
        startingPrice: startingPrice || null,
        size: size || null,
        features: normalizeFeatures(features) ?? null,
        badge: badge || null,
        popular: popular ?? false,
        enabled: enabled ?? true,
        sortOrder: sortOrder ?? 0,
        projectId: projectId || null,
      },
    })
    return NextResponse.json({ success: true, plan }, { status: 201 })
  } catch (error) {
    console.error('Payment plans POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
