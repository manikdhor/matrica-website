import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

/** Normalize an incoming `features` value to a JSON string array (or null). */
function normalizeFeatures(features: unknown): string | null {
  if (features === null || features === undefined) return null
  if (Array.isArray(features)) return JSON.stringify(features.map((f) => String(f)))
  return String(features)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('projects', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const { name, startingPrice, size, features, badge, popular, enabled, sortOrder, projectId } = await req.json()
    const plan = await db.paymentPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(startingPrice !== undefined && { startingPrice: startingPrice || null }),
        ...(size !== undefined && { size: size || null }),
        ...(features !== undefined && { features: normalizeFeatures(features) }),
        ...(badge !== undefined && { badge: badge || null }),
        ...(popular !== undefined && { popular }),
        ...(enabled !== undefined && { enabled }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
    })
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Payment plans PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('projects', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    await db.paymentPlan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment plans DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
