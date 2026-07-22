import { NextResponse } from 'next/server'
import { getContentSectionsMap } from '@/lib/content-sections-data'

/**
 * PUBLIC endpoint — admin-managed content sections (Why Choose Us,
 * How It Works, CTA, About page blocks, legal pages).
 * Returns a map keyed by sectionKey so components can pick their section
 * in O(1): { why_choose_us: {...}, how_it_works: {...}, ... }
 */
export async function GET() {
  return NextResponse.json(await getContentSectionsMap())
}
