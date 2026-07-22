import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import { getPublishedProjects } from '@/lib/projects-data'
import { getContentSectionsMap } from '@/lib/content-sections-data'
import ProjectsPage from '@/components/ProjectsPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/projects',
    title: `Our Projects | ${name}`,
    description: `Explore ${name}'s residential projects in Purbachal, Dhaka — planned in line with RAJUK policy, beside RAJUK Purbachal New Town, with modern infrastructure, wide roads, and green spaces.`,
  })
}

// ISR — matches the 60s in-memory cache TTL in projects-data.ts so a static
// prod build still picks up admin edits within a minute.
export const revalidate = 60

// Server-fetched so the grid renders real projects on first paint instead of
// waiting on a client /api/projects round-trip (the old fallback-then-real flash).
export default async function Page() {
  const [projects, contentSections] = await Promise.all([
    getPublishedProjects(),
    getContentSectionsMap(),
  ])
  return <ProjectsPage initialProjects={projects} initialContentSections={contentSections} />
}