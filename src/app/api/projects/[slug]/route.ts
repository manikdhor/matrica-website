import { NextResponse } from 'next/server'
import { getPublishedProjectBySlug } from '@/lib/projects-data'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getPublishedProjectBySlug(slug)
  return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
