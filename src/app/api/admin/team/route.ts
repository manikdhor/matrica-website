import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('team', false)
  if (auth instanceof Response) return auth
  try {
    const members = await db.teamMember.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(members)
  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('team', true)
  if (auth instanceof Response) return auth
  try {
    const { name, designation, bio, message, photo, phone, email, category, isLeadership, status, sortOrder, facebook, linkedin } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const member = await db.teamMember.create({ data: { name, designation, bio, message, photo, phone, email, category: category || 'management', isLeadership: isLeadership === true, status: status || 'active', sortOrder: sortOrder ?? 0, facebook, linkedin } })
    return NextResponse.json({ success: true, member }, { status: 201 })
  } catch (error) {
    console.error('Team POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('team', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { name, designation, bio, message, photo, phone, email, category, isLeadership, status, sortOrder, facebook, linkedin } = updates
    const member = await db.teamMember.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(designation !== undefined && { designation }), ...(bio !== undefined && { bio }), ...(message !== undefined && { message }), ...(photo !== undefined && { photo }), ...(phone !== undefined && { phone }), ...(email !== undefined && { email }), ...(category !== undefined && { category }), ...(isLeadership !== undefined && { isLeadership: isLeadership === true }), ...(status !== undefined && { status }), ...(sortOrder !== undefined && { sortOrder }), ...(facebook !== undefined && { facebook }), ...(linkedin !== undefined && { linkedin }) } })
    return NextResponse.json({ success: true, member })
  } catch (error) {
    console.error('Team PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('team', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}