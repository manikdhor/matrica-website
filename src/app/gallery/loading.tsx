import { PageHeroSkeleton } from '@/components/PageLoadingSkeleton'
import { SkeletonBox } from '@/components/SkeletonPulse'

const HEIGHTS = [320, 260, 280, 260, 320, 280, 280, 320, 260]

export default function Loading() {
  return (
    <div className="bg-background">
      <PageHeroSkeleton />
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {HEIGHTS.map((h, i) => (
            <SkeletonBox key={i} className="w-full break-inside-avoid rounded-xl" style={{ height: h }} />
          ))}
        </div>
      </div>
    </div>
  )
}
