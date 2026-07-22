import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('heroSlides', false)
  if (auth instanceof Response) return auth
  try {
    const slides = await db.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(slides)
  } catch (error) {
    console.error('Hero slides GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('heroSlides', true)
  if (auth instanceof Response) return auth
  try {
    const { title, subtitle, description, imageUrl, backgroundImage, cta1Text, cta1Href, cta2Text, cta2Href, ctaText, ctaLink, label, enabled, sortOrder, status, mobileImage } = await request.json()
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    const slide = await db.heroSlide.create({ data: { title, subtitle, description, imageUrl, backgroundImage, cta1Text, cta1Href, cta2Text, cta2Href, ctaText, ctaLink, label, enabled: enabled ?? true, sortOrder: sortOrder ?? 0, status: status || 'active', mobileImage } })
    return NextResponse.json({ success: true, slide }, { status: 201 })
  } catch (error) {
    console.error('Hero slides POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('heroSlides', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { title, subtitle, description, imageUrl, backgroundImage, cta1Text, cta1Href, cta2Text, cta2Href, ctaText, ctaLink, label, enabled, sortOrder, status, mobileImage } = updates
    const slide = await db.heroSlide.update({ where: { id }, data: { ...(title !== undefined && { title }), ...(subtitle !== undefined && { subtitle }), ...(description !== undefined && { description }), ...(imageUrl !== undefined && { imageUrl }), ...(backgroundImage !== undefined && { backgroundImage }), ...(cta1Text !== undefined && { cta1Text }), ...(cta1Href !== undefined && { cta1Href }), ...(cta2Text !== undefined && { cta2Text }), ...(cta2Href !== undefined && { cta2Href }), ...(ctaText !== undefined && { ctaText }), ...(ctaLink !== undefined && { ctaLink }), ...(label !== undefined && { label }), ...(enabled !== undefined && { enabled }), ...(sortOrder !== undefined && { sortOrder }), ...(status !== undefined && { status }), ...(mobileImage !== undefined && { mobileImage }) } })
    return NextResponse.json({ success: true, slide })
  } catch (error) {
    console.error('Hero slides PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('heroSlides', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.heroSlide.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hero slides DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}