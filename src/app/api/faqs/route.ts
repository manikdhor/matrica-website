import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export interface PublicFaq {
  id: string
  question: string
  answer: string
  category: string
  sortOrder: number
}

export interface PublicFaqsPayload {
  faqs: PublicFaq[]
  fallback?: boolean
}

const FALLBACK: PublicFaqsPayload = { faqs: [], fallback: true }

// Simple in-memory cache (same pattern as /api/site-settings)
let cache: PublicFaqsPayload | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const faqs = await db.fAQ.findMany({
      where: { enabled: true, status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        sortOrder: true,
      },
    })

    if (faqs.length === 0) {
      // Nothing published yet — client keeps its hardcoded content.
      return NextResponse.json(FALLBACK)
    }

    const payload: PublicFaqsPayload = { faqs }
    cache = payload
    cacheTime = now
    return NextResponse.json(payload)
  } catch {
    // DB unreachable — public page falls back to hardcoded content.
    return NextResponse.json(FALLBACK)
  }
}
