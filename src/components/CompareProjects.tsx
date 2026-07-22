'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scale,
  X,
  Trash2,
  MapPin,
  Ruler,
  Square,
  DollarSign,
  Activity,
  Sparkles,
  Crown,
  Plus,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useSiteProjectsOrdered, type PublicProject } from '@/lib/use-projects'
import { useT } from '@/lib/use-ui-strings'

export interface CompareProject {
  name: string
  slug: string
  status: string
  tagline: string
  location: string
  image: string
  totalArea: string
  plotSize: string
  priceRange: string
  features: string[]
}

/* Pull a spec value by matching its label against candidate substrings. */
function specValue(project: PublicProject, candidates: string[]): string {
  const spec = project.specs.find((s) =>
    candidates.some((c) => s.label.toLowerCase().includes(c)),
  )
  return spec?.value ?? ''
}

/* Map a DB-backed PublicProject onto the comparison-table row shape. */
function toCompareProject(p: PublicProject): CompareProject {
  return {
    name: p.name,
    slug: p.slug,
    status: p.status,
    tagline: p.tagline,
    location: p.location,
    image: p.cardImage,
    totalArea: specValue(p, ['total area', 'area', 'land area', 'project size']) || '—',
    plotSize: p.plotSizes || specValue(p, ['plot size', 'plot']) || '—',
    priceRange: p.priceRange || p.priceStart || '—',
    features: p.cardHighlights,
  }
}

interface CompareProjectsProps {
  selectedProjects: string[]
  onToggleProject: (slug: string) => void
  onClearAll: () => void
}

const comparisonRows = [
  { key: 'location', labelKey: 'projects.compare.rowLocation', icon: <MapPin className="w-4 h-4" /> },
  { key: 'totalArea', labelKey: 'projects.compare.rowTotalArea', icon: <Ruler className="w-4 h-4" /> },
  { key: 'plotSize', labelKey: 'projects.compare.rowPlotSize', icon: <Square className="w-4 h-4" /> },
  { key: 'priceRange', labelKey: 'projects.compare.rowPriceRange', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'status', labelKey: 'projects.compare.rowStatus', icon: <Activity className="w-4 h-4" /> },
  { key: 'features', labelKey: 'projects.compare.rowFeatures', icon: <Sparkles className="w-4 h-4" /> },
]

export function CompareProjects({
  selectedProjects,
  onToggleProject,
  onClearAll,
}: CompareProjectsProps) {
  const t = useT()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { projects: allProjects } = useSiteProjectsOrdered()

  const compareData = useMemo(
    () => allProjects.map(toCompareProject),
    [allProjects],
  )

  const selected = compareData.filter((p) =>
    selectedProjects.includes(p.slug)
  )

  // Price extraction helper – gets the lower bound numeric value from strings like "৳ 15–45 Lac"
  const parsePriceLower = (priceStr: string): number => {
    const match = priceStr.match(/[\d.]+/)
    return match ? parseFloat(match[0]) : Infinity
  }

  const lowestPriceIdx = useMemo(() => {
    if (selected.length < 2) return -1
    let min = Infinity
    let minIdx = -1
    selected.forEach((p, i) => {
      const val = parsePriceLower(p.priceRange)
      if (val < min) {
        min = val
        minIdx = i
      }
    })
    return minIdx
  }, [selected])

  // Feature shared check – if a feature appears in ALL selected projects
  const featureSharedMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    if (selected.length < 2) return map
    const allFeatures = new Set(selected.flatMap((p) => p.features))
    allFeatures.forEach((f) => {
      map[f] = selected.every((p) => p.features.includes(f))
    })
    return map
  }, [selected])

  const getRowValue = (project: CompareProject, key: string) => {
    switch (key) {
      case 'features':
        return project.features.join(', ')
      default:
        return (
          (project as unknown as Record<string, string>)[key] ?? '—'
        )
    }
  }

  return (
    <>
      {/* Floating Compare Button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={selectedProjects.length === 0}
        title={
          selectedProjects.length > 0
            ? `${t('projects.compare.floatTitle')} ${selectedProjects.length} ${selectedProjects.length > 1 ? t('projects.compare.projectsPlural') : t('projects.compare.projectSingular')}`
            : t('projects.compare.noneSelected')
        }
        className={cn(
          'fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 transition-all duration-300 hover:scale-105',
          selectedProjects.length > 0
            ? 'bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#1E6B3A]/90'
            : 'bg-[#FFFFFF] text-[#475569] border border-border cursor-not-allowed'
        )}
        style={
          selectedProjects.length > 0
            ? { animation: 'pulse-glow-gold 2s ease-in-out infinite' }
            : undefined
        }
        aria-label={t('projects.compare.floatAria')}
      >
        <Scale className="w-5 h-5" />
        <span className="text-sm font-semibold">{t('projects.compare.buttonLabel')}</span>
        {selectedProjects.length > 0 && (
          <span
            key={selectedProjects.length}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFFFFF] text-[#1E6B3A] text-xs font-bold"
            style={{ animation: 'badge-bounce 0.4s ease-out' }}
          >
            {selectedProjects.length}
          </span>
        )}
      </button>

      <style jsx>{`
        @keyframes badge-bounce {
          0% { transform: scale(1.4); }
          60% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Comparison Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-white border border-gray-200 max-w-4xl w-[calc(100%-2rem)] max-h-[85vh] overflow-auto p-0"
        >
          {/* Gold header bar */}
          <div className="bg-[#1E6B3A]/10 border-b border-[#1E6B3A]/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-[#1A202C] text-lg font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#1E6B3A]" />
                {t('projects.compare.dialogTitle')}
                <span className="text-sm font-normal text-[#475569]">
                  ({selected.length}/3)
                </span>
              </DialogTitle>
              <DialogDescription className="text-[#475569] text-xs">
                {t('projects.compare.dialogDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-[#475569] hover:text-[#1A202C] flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-[#1E6B3A]/30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {t('projects.compare.clearAll')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#475569] hover:text-[#1A202C] hover:border-[#1E6B3A]/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selected.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <p className="text-[#475569] text-sm text-center mb-6">
                {selected.length === 1
                  ? t('projects.compare.oneSelected')
                  : t('projects.compare.selectAtLeastTwo')}
              </p>
              <div className="flex gap-4 mb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-32 h-36 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors',
                      i < selected.length
                        ? 'border-[#1E6B3A]/40 bg-[#1E6B3A]/5'
                        : 'border-border bg-[#FFFFFF]/30'
                    )}
                  >
                    {i < selected.length ? (
                      <>
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#1E6B3A]/30">
                          <img
                            src={selected[i].image}
                            alt={selected[i].name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[#1A202C] text-xs font-medium text-center px-1">
                          {selected[i].name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-[#475569]/40" />
                        <span className="text-[#475569]/50 text-xs">{t('projects.compare.addProject')}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[#475569]/50 text-xs">
                {t('projects.compare.getStartedHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table */}
              <table className="w-full text-sm">
                {/* Header – project names */}
                <thead>
                  <tr>
                    <th className="text-left p-4 text-[#475569] font-medium w-44 sticky left-0 bg-[#FFFFFF] z-[1]" />
                    {selected.map((project) => (
                      <th
                        key={project.slug}
                        className="relative text-center p-4 min-w-[220px]"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => onToggleProject(project.slug)}
                            className="absolute top-2 right-2 text-[#475569] hover:text-red-400 transition-colors"
                            aria-label={`${t('projects.compare.removeAria')} ${project.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border hover:border-[#1E6B3A]/50 transition-colors">
                            <img
                              src={project.image}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[#1A202C] font-semibold">
                            {project.name}
                          </span>
                          <span className="text-[#475569] text-xs">
                            {project.tagline}
                          </span>
                          <button
                            onClick={() => {
                              setIsOpen(false)
                              router.push(`/projects/${project.slug}`)
                            }}
                            className="text-[#1E6B3A] text-xs hover:underline transition-colors"
                          >
                            {t('projects.compare.viewDetails')}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* gold-line divider between header and data */}
                  <tr>
                    <td colSpan={selected.length + 1} className="p-0">
                      <div className="gold-line h-px" />
                    </td>
                  </tr>
                  {comparisonRows.map((row, idx) => (
                    <tr
                      key={row.key}
                      className={cn(
                        idx % 2 === 0 ? 'bg-[#FFFFFF]/30' : 'bg-transparent'
                      )}
                    >
                      <td
                        className="p-4 text-[#475569] font-medium sticky left-0 z-[1] flex items-center gap-2 border-l-2 border-[#1E6B3A]/20"
                        style={{
                          background: idx % 2 === 0
                            ? 'rgba(255,255,255,0.98)'
                            : 'rgba(248,250,251,0.98)',
                        }}
                      >
                        {row.icon}
                        {t(row.labelKey)}
                      </td>
                      {selected.map((project, pIdx) => (
                        <td
                          key={project.slug}
                          className={cn(
                            'p-4 text-center',
                            row.key === 'priceRange' && pIdx === lowestPriceIdx
                              ? 'text-[#1E6B3A] font-semibold'
                              : 'text-[#1A202C]/80'
                          )}
                        >
                          {row.key === 'status' ? (
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded text-xs font-medium border',
                                project.status === 'Ongoing'
                                  ? 'bg-[#1E6B3A]/20 text-[#1E6B3A] border-[#1E6B3A]/30'
                                  : 'bg-[#4A90D9]/20 text-[#4A90D9] border-[#4A90D9]/30'
                              )}
                            >
                              {project.status}
                            </span>
                          ) : row.key === 'features' ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {project.features.map((f) => {
                                const isShared = featureSharedMap[f]
                                return (
                                  <span
                                    key={f}
                                    className={cn(
                                      'inline-block text-xs px-2 py-0.5 rounded-full border',
                                      isShared
                                        ? 'bg-[#FFFFFF]/60 text-[#475569] border-border'
                                        : 'bg-[#1E6B3A]/15 text-[#1E6B3A] border-[#1E6B3A]/30'
                                    )}
                                  >
                                    {f}
                                  </span>
                                )
                              })}
                            </div>
                          ) : row.key === 'priceRange' && pIdx === lowestPriceIdx ? (
                            <div className="flex flex-col items-center gap-1">
                              <span>{project.priceRange}</span>
                              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-[#1E6B3A]/20 text-[#1E6B3A] font-medium">
                                {t('projects.compare.bestValue')}
                              </span>
                            </div>
                          ) : (
                            getRowValue(project, row.key)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Verdict / Recommendation Row */}
                  <tr>
                    <td colSpan={selected.length + 1} className="p-0">
                      <div className="gold-line h-px" />
                    </td>
                  </tr>
                  <tr className="bg-[#1E6B3A]/5">
                    <td
                      className="p-4 text-[#1E6B3A] font-semibold sticky left-0 z-[1] flex items-center gap-2 border-l-2 border-[#1E6B3A]/20"
                      style={{ background: 'rgba(255,255,255,0.95)' }}
                    >
                      <Crown className="w-4 h-4" />
                      {t('projects.compare.recommendation')}
                    </td>
                    {selected.map((project) => {
                      const isAvailable = project.status === 'Ongoing' || project.status === 'Ready'
                      return (
                        <td key={project.slug} className="p-4 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-sm font-medium',
                              isAvailable
                                ? 'text-emerald-400'
                                : 'text-[#4A90D9]'
                            )}
                          >
                            {isAvailable ? '✓ ' : ''}
                            {isAvailable ? t('projects.compare.availableNow') : t('projects.compare.comingSoon')}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}