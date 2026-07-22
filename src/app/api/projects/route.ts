import { NextResponse } from 'next/server'
import { getPublishedProjects } from '@/lib/projects-data'

export async function GET() {
  return NextResponse.json(await getPublishedProjects())
}
