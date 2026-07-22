import { PageHeroSkeleton } from '@/components/PageLoadingSkeleton'
import { SkeletonCard } from '@/components/SkeletonPulse'

export default function Loading() {
  return (
    <div className="bg-background">
      <PageHeroSkeleton />
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
