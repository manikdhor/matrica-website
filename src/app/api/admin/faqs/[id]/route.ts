import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('faqs', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const item = await db.fAQ.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('FAQs [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('faqs', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { question, answer, category, sortOrder, enabled, status } = await req.json()
    const item = await db.fAQ.update({ where: { id }, data: { ...(question !== undefined && { question }), ...(answer !== undefined && { answer }), ...(category !== undefined && { category }), ...(sortOrder !== undefined && { sortOrder }), ...(enabled !== undefined && { enabled }), ...(status !== undefined && { status }) } })
    return NextResponse.json(item)
  } catch (error) {
    console.error('FAQs [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('faqs', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.fAQ.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('FAQs [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}