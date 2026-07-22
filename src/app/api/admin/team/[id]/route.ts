import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('team', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const member = await db.teamMember.findUnique({ where: { id } })
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(member)
  } catch (error) {
    console.error('Team [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('team', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { name, designation, bio, message, photo, phone, email, category, isLeadership, status, sortOrder, facebook, linkedin } = await req.json()
    const member = await db.teamMember.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(designation !== undefined && { designation }), ...(bio !== undefined && { bio }), ...(message !== undefined && { message }), ...(photo !== undefined && { photo }), ...(phone !== undefined && { phone }), ...(email !== undefined && { email }), ...(category !== undefined && { category }), ...(isLeadership !== undefined && { isLeadership: isLeadership === true }), ...(status !== undefined && { status }), ...(sortOrder !== undefined && { sortOrder }), ...(facebook !== undefined && { facebook }), ...(linkedin !== undefined && { linkedin }) } })
    return NextResponse.json(member)
  } catch (error) {
    console.error('Team [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('team', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}