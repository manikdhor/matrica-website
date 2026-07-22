import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export interface PublicTeamMember {
  id: string
  name: string
  designation: string
  category: string
  photo: string | null
  bio: string | null
  message: string | null
  sortOrder: number
}

export interface PublicTeamPayload {
  leadership: PublicTeamMember[]
  team: PublicTeamMember[]
  fallback?: boolean
}

const FALLBACK: PublicTeamPayload = { leadership: [], team: [], fallback: true }

// Simple in-memory cache
let cache: PublicTeamPayload | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const members = await db.teamMember.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        designation: true,
        category: true,
        photo: true,
        bio: true,
        message: true,
        isLeadership: true,
        sortOrder: true,
      },
    })

    if (members.length === 0) {
      // Nothing published yet — tell the client to keep its hardcoded content.
      return NextResponse.json(FALLBACK)
    }

    const payload: PublicTeamPayload = {
      leadership: members
        .filter((m) => m.isLeadership)
        .map(({ isLeadership: _l, ...rest }) => rest),
      team: members
        .filter((m) => !m.isLeadership)
        .map(({ isLeadership: _l, ...rest }) => rest),
    }
    cache = payload
    cacheTime = now
    return NextResponse.json(payload)
  } catch {
    // DB unreachable — public page falls back to hardcoded content.
    return NextResponse.json(FALLBACK)
  }
}
