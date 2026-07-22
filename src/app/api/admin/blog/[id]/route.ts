import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('blog', false)
  if (auth instanceof Response) return auth
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('blog', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { title, slug, excerpt, content, category, authorId, authorName, featuredImage, status, publishedAt } = await request.json()
    const finalPublishedAt = status === 'published' && !publishedAt ? new Date() : publishedAt
    const post = await db.blogPost.update({ where: { id }, data: { ...(title !== undefined && { title }), ...(slug !== undefined && { slug }), ...(excerpt !== undefined && { excerpt }), ...(content !== undefined && { content }), ...(category !== undefined && { category }), ...(authorId !== undefined && { authorId }), ...(authorName !== undefined && { authorName }), ...(featuredImage !== undefined && { featuredImage }), ...(status !== undefined && { status }), ...(finalPublishedAt !== undefined && finalPublishedAt !== null && { publishedAt: finalPublishedAt }) } })
    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Blog [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('blog', true)
  if (auth instanceof Response) return auth
  const { id } = await params
  await db.blogPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}