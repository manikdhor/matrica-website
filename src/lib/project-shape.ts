/**
 * Canonical public project shape + Prisma→public mapper.
 * The public site renders entirely from this shape (icons are stored as
 * name strings, resolved at render time via src/lib/icons.tsx). Server-safe.
 */

export interface PublicProject {
  id: string
  name: string
  slug: string
  status: string          // Title-cased for display: Ongoing | Upcoming | Ready | Completed
  tagline: string
  description: string
  summary: string
  heroImage: string
  cardImage: string
  logo: string
  mapImage: string
  mapsQuery: string
  location: string
  address: string
  plotSizes: string
  totalPlots: number | null
  availablePlots: number | null
  priceRange: string
  priceStart: string
  featured: boolean
  sortOrder: number
  cardHighlights: string[]
  specs: { label: string; value: string }[]
  highlights: { title: string; detail: string }[]
  stages: { label: string; stage: string }[]
  amenities: { icon: string; label: string }[]
  distances: { place: string; value: string }[]
  landmarks: { icon: string; name: string; minutes: number; angle: number; ring: number }[]
  faqs: { question: string; answer: string }[]
  images: string[]
  documents: { id: string; docType: string; label: string; fileUrl: string; viewable: boolean; gated: boolean; enabled: boolean; downloads: number }[]
}

function titleStatus(s?: string | null): string {
  if (!s) return 'Ongoing'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function parseCardHighlights(raw?: string | null): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return raw.split(/\n|·/).map((x) => x.trim()).filter(Boolean)
  }
}

/* Loosely-typed Prisma row (avoids importing generated types into client bundles). */
type Row = Record<string, unknown> & {
  specs?: unknown[]; stages?: unknown[]; amenities?: unknown[]; distances?: unknown[]
  landmarks?: unknown[]; faqs?: unknown[]; images?: unknown[]; highlights?: unknown[]; documents?: unknown[]
}

export function shapeProject(p: Row): PublicProject {
  const arr = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : [])
  const str = (x: unknown, d = ''): string => (typeof x === 'string' ? x : d)
  return {
    id: str(p.id),
    name: str(p.name),
    slug: str(p.slug),
    status: titleStatus(str(p.status, 'ongoing')),
    tagline: str(p.tagline),
    description: str(p.description),
    summary: str(p.summary),
    heroImage: str(p.heroImage),
    cardImage: str(p.cardImage) || str(p.heroImage),
    logo: str(p.logo),
    mapImage: str(p.mapImage),
    mapsQuery: str(p.mapsQuery),
    location: str(p.locationArea),
    address: str(p.address),
    plotSizes: str(p.plotSizes),
    totalPlots: (p.totalPlots as number) ?? null,
    availablePlots: (p.availablePlots as number) ?? null,
    priceRange: str(p.priceRange),
    priceStart: str(p.priceStart),
    featured: Boolean(p.featured),
    sortOrder: (p.sortOrder as number) ?? 0,
    cardHighlights: parseCardHighlights(str(p.cardHighlights)),
    specs: arr<{ label: string; value: string }>(p.specs).map((s) => ({ label: str(s.label), value: str(s.value) })),
    highlights: arr<{ title: string; detail: string }>(p.highlights).map((h) => ({ title: str(h.title), detail: str(h.detail) })),
    stages: arr<{ label: string; stage: string }>(p.stages).map((s) => ({ label: str(s.label), stage: str(s.stage, 'Planned') })),
    amenities: arr<{ icon: string; label: string }>(p.amenities).map((a) => ({ icon: str(a.icon), label: str(a.label) })),
    distances: arr<{ place: string; value: string }>(p.distances).map((d) => ({ place: str(d.place), value: str(d.value) })),
    landmarks: arr<{ icon: string; name: string; minutes: number; angle: number; ring: number }>(p.landmarks).map((l) => ({
      icon: str(l.icon), name: str(l.name),
      minutes: (l.minutes as number) ?? 0, angle: (l.angle as number) ?? 0, ring: (l.ring as number) ?? 1,
    })),
    faqs: arr<{ question: string; answer: string }>(p.faqs).map((f) => ({ question: str(f.question), answer: str(f.answer) })),
    images: arr<{ url: string }>(p.images).map((i) => str(i.url)).filter(Boolean),
    documents: arr<Record<string, unknown>>(p.documents).map((d) => ({
      id: str(d.id), docType: str(d.docType, 'brochure'), label: str(d.label),
      fileUrl: str(d.fileUrl), viewable: d.viewable !== false, gated: Boolean(d.gated),
      enabled: d.enabled !== false, downloads: (d.downloads as number) ?? 0,
    })),
  }
}

/* Minimal offline fallback — only used when the DB is empty/unreachable. */
export const FALLBACK_PROJECTS: PublicProject[] = [
  {
    id: 'fallback-1', name: 'Chandra Chaya', slug: 'chandra-chaya', status: 'Ongoing',
    tagline: 'A 500-bigha master-planned community beside Zinda Park.', description: '', summary: '',
    heroImage: '/images/project-chandrachaya-v2.webp', cardImage: '/images/project-chandrachaya-v2.webp',
    logo: '/images/chandra-chaya-logo.webp', mapImage: '/images/maps/chandra-chaya-location-map.webp',
    mapsQuery: 'Zinda Park Purbachal Dhaka', location: 'Purbachal, Dhaka', address: 'Purbachal, Dhaka',
    plotSizes: '3 · 5 · 10 Katha', totalPlots: null, availablePlots: null, priceRange: '', priceStart: '',
    featured: true, sortOrder: 0, cardHighlights: ['550 Bigha Area', '3, 5 & 10 Katha Plots', "60', 30', 25' Roads"],
    specs: [], highlights: [], stages: [], amenities: [], distances: [], landmarks: [], faqs: [], images: [], documents: [],
  },
  {
    id: 'fallback-2', name: 'Ventura City', slug: 'ventura-city', status: 'Ongoing',
    tagline: 'Modern living beside RAJUK Purbachal New Town — wide internal roads in the heart of Purbachal.', description: '', summary: '',
    heroImage: '/images/project-ventura.webp', cardImage: '/images/project-ventura.webp',
    logo: '/images/ventura-city-logo.webp', mapImage: '/images/maps/ventura-city-location-map.webp',
    mapsQuery: 'Purbachal New Town Dhaka', location: 'Purbachal, Dhaka', address: 'Purbachal, Dhaka',
    plotSizes: '3 · 5 Katha', totalPlots: null, availablePlots: null, priceRange: '', priceStart: '',
    featured: true, sortOrder: 1, cardHighlights: ['3 & 5 Katha Plots', "25' · 50' Roads", 'Beside Purbachal New Town'],
    specs: [], highlights: [], stages: [], amenities: [], distances: [], landmarks: [], faqs: [], images: [], documents: [],
  },
]
