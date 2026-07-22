import { NextResponse } from 'next/server'
import { getHeroSlides } from '@/lib/hero-slides'

export type { PublicHeroSlide, PublicHeroSlidesPayload } from '@/lib/hero-slides'

export async function GET() {
  return NextResponse.json(await getHeroSlides())
}
