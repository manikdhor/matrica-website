import { PageHeroSkeleton } from '@/components/PageLoadingSkeleton'
import { SkeletonBox } from '@/components/SkeletonPulse'

export default function Loading() {
  return (
    <div className="bg-background">
      <PageHeroSkeleton />
      <div className="py-20 max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <SkeletonBox className="h-12 w-full" />
          <SkeletonBox className="h-12 w-full" />
          <SkeletonBox className="h-32 w-full" />
          <SkeletonBox className="h-12 w-40" />
        </div>
        <div className="space-y-4">
          <SkeletonBox className="h-40 w-full" />
          <SkeletonBox className="h-6 w-2/3" />
          <SkeletonBox className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  )
}
