import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { invalidatePersonaCache } from '@/app/api/chat/route'

export async function GET() {
  const auth = await requirePermission('ai', false)
  if (auth instanceof Response) return auth
  try {
    // Persona lives in the Setting table under chat_* keys. It is exposed here
    // (under the 'ai' module) so admins with AI access but without the
    // 'settings' permission can still manage the chat persona.
    const [entries, personaRows] = await Promise.all([
      db.aiKnowledge.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.setting.findMany({ where: { key: { startsWith: 'chat_' } }, select: { key: true, value: true } }),
    ])
    const persona: Record<string, string | null> = {}
    personaRows.forEach((row) => { persona[row.key] = row.value })
    return NextResponse.json({ entries, persona })
  } catch (error) {
    console.error('AI training GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof Response) return auth
  try {
    const { title, content, category, enabled, sortOrder } = await request.json()
    if (!title || !content) return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    const entry = await db.aiKnowledge.create({
      data: {
        title,
        content,
        category: category || null,
        enabled: enabled ?? true,
        sortOrder: sortOrder ?? 0,
      },
    })
    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (error) {
    console.error('AI training POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()

    // Persona save: upserts chat_* Setting keys ONLY (any other key is rejected
    // so this endpoint can't be used to write arbitrary settings).
    if (body.persona !== undefined) {
      const persona = body.persona
      if (!persona || typeof persona !== 'object' || Array.isArray(persona)) {
        return NextResponse.json({ error: 'persona must be an object' }, { status: 400 })
      }
      const pairs = Object.entries(persona as Record<string, unknown>)
      if (pairs.some(([key]) => !key.startsWith('chat_'))) {
        return NextResponse.json({ error: 'Only chat_* keys are allowed' }, { status: 400 })
      }
      if (pairs.length > 0) {
        await db.$transaction(
          pairs.map(([key, value]) =>
            db.setting.upsert({
              where: { key },
              update: { value: String(value) },
              create: { key, value: String(value) },
            })
          )
        )
        // Chat route caches persona settings in-process — drop it immediately
        invalidatePersonaCache()
      }
      return NextResponse.json({ success: true })
    }

    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { title, content, category, enabled, sortOrder } = updates
    const entry = await db.aiKnowledge.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category: category || null }),
        ...(enabled !== undefined && { enabled }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('AI training PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.aiKnowledge.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI training DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
