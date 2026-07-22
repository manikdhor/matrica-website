import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('blog', false)
  if (auth instanceof Response) return auth
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (search) where.OR = [{ title: { contains: search } }, { slug: { contains: search } }]
  if (status) where.status = status

  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    }),
    db.blogPost.count({ where }),
  ])
  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('blog', true)
  if (auth instanceof Response) return auth
  try {
    const { title, slug: rawSlug, excerpt, content, category, authorId, authorName, featuredImage, status, publishedAt } = await request.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    let slug = rawSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }
    const finalPublishedAt = status === 'published' && !publishedAt ? new Date() : publishedAt
    const post = await db.blogPost.create({ data: { title, slug, ...(excerpt !== undefined && { excerpt }), ...(content !== undefined && { content }), ...(category !== undefined && { category }), ...(authorId !== undefined && { authorId }), ...(authorName !== undefined && { authorName }), ...(featuredImage !== undefined && { featuredImage }), ...(status !== undefined && { status }), ...(finalPublishedAt !== undefined && finalPublishedAt !== null && { publishedAt: finalPublishedAt }) } })
    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error('Blog POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('blog', true)
  if (auth instanceof Response) return auth
  try {
    const { id, title, slug, excerpt, content, category, authorId, authorName, featuredImage, status, publishedAt } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const finalPublishedAt = status === 'published' && !publishedAt ? new Date() : publishedAt
    const post = await db.blogPost.update({ where: { id }, data: { ...(title !== undefined && { title }), ...(slug !== undefined && { slug }), ...(excerpt !== undefined && { excerpt }), ...(content !== undefined && { content }), ...(category !== undefined && { category }), ...(authorId !== undefined && { authorId }), ...(authorName !== undefined && { authorName }), ...(featuredImage !== undefined && { featuredImage }), ...(status !== undefined && { status }), ...(finalPublishedAt !== undefined && finalPublishedAt !== null && { publishedAt: finalPublishedAt }) } })
    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Blog PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('blog', true)
  if (auth instanceof Response) return auth
  const { id } = await request.json()
  await db.blogPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}