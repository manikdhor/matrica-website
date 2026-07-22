import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('faqs', false)
  if (auth instanceof Response) return auth
  try {
    const faqs = await db.fAQ.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(faqs)
  } catch (error) {
    console.error('FAQs GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('faqs', true)
  if (auth instanceof Response) return auth
  try {
    const { question, answer, category, sortOrder, status } = await request.json()
    if (!question || !answer) return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    const faq = await db.fAQ.create({ data: { question, answer, category: category || 'general', sortOrder: sortOrder ?? 0, status: status || 'active' } })
    return NextResponse.json({ success: true, faq }, { status: 201 })
  } catch (error) {
    console.error('FAQs POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('faqs', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { question, answer, category, sortOrder, enabled, status } = updates
    const faq = await db.fAQ.update({ where: { id }, data: { ...(question !== undefined && { question }), ...(answer !== undefined && { answer }), ...(category !== undefined && { category }), ...(sortOrder !== undefined && { sortOrder }), ...(enabled !== undefined && { enabled }), ...(status !== undefined && { status }) } })
    return NextResponse.json({ success: true, faq })
  } catch (error) {
    console.error('FAQs PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('faqs', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.fAQ.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('FAQs DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}