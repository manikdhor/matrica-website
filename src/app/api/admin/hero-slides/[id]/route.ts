import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('heroSlides', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const slide = await db.heroSlide.findUnique({ where: { id } })
    if (!slide) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(slide)
  } catch (error) {
    console.error('Hero slides [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('heroSlides', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { title, subtitle, description, imageUrl, backgroundImage, mobileImage, cta1Text, cta1Href, cta2Text, cta2Href, ctaText, ctaLink, label, enabled, sortOrder, status } = await req.json()

    const slide = await db.heroSlide.update({
      where: { id },
      data: { ...(title !== undefined && { title }), ...(subtitle !== undefined && { subtitle }), ...(description !== undefined && { description }), ...(imageUrl !== undefined && { imageUrl }), ...(backgroundImage !== undefined && { backgroundImage }), ...(mobileImage !== undefined && { mobileImage }), ...(cta1Text !== undefined && { cta1Text }), ...(cta1Href !== undefined && { cta1Href }), ...(cta2Text !== undefined && { cta2Text }), ...(cta2Href !== undefined && { cta2Href }), ...(ctaText !== undefined && { ctaText }), ...(ctaLink !== undefined && { ctaLink }), ...(label !== undefined && { label }), ...(enabled !== undefined && { enabled }), ...(sortOrder !== undefined && { sortOrder }), ...(status !== undefined && { status }) },
    })
    return NextResponse.json(slide)
  } catch (error) {
    console.error('Hero slides [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('heroSlides', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.heroSlide.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hero slides [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}