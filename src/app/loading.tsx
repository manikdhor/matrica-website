import { SkeletonBox } from '@/components/SkeletonPulse'

/**
 * Route-level loading UI — shown instantly while a public page's server
 * component streams. A quiet brand shimmer, no layout shift.
 */
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 bg-background">
      <div className="text-center space-y-3">
        <SkeletonBox className="h-3 w-32 mx-auto" />
        <SkeletonBox className="h-8 w-56 mx-auto" />
        <SkeletonBox className="h-3 w-40 mx-auto" />
      </div>
      <div
        className="h-[2px] w-28 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--brand,#1E6B3A), var(--gold,#C9A24B), transparent)',
        }}
      />
    </div>
  )
}
