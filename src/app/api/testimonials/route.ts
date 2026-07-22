import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export interface PublicTestimonial {
  id: string
  name: string
  designation: string | null
  content: string
  photo: string | null
  rating: number
  sortOrder: number
}

export interface PublicTestimonialsPayload {
  testimonials: PublicTestimonial[]
  fallback?: boolean
}

const FALLBACK: PublicTestimonialsPayload = { testimonials: [], fallback: true }

// Simple in-memory cache (same pattern as /api/site-settings)
let cache: PublicTestimonialsPayload | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const testimonials = await db.testimonial.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        designation: true,
        content: true,
        photo: true,
        rating: true,
        sortOrder: true,
      },
    })

    if (testimonials.length === 0) {
      // Nothing published yet — client keeps its hardcoded content.
      return NextResponse.json(FALLBACK)
    }

    const payload: PublicTestimonialsPayload = { testimonials }
    cache = payload
    cacheTime = now
    return NextResponse.json(payload)
  } catch {
    // DB unreachable — public page falls back to hardcoded content.
    return NextResponse.json(FALLBACK)
  }
}
