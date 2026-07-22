import { SkeletonBox } from '@/components/SkeletonPulse'

export default function Loading() {
  return (
    <div className="bg-background">
      <SkeletonBox className="h-[60vh] min-h-[420px] w-full rounded-none" />
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonBox className="h-8 w-64" />
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={i} className="h-4" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
          <SkeletonBox className="h-80 w-full" />
        </div>
      </div>
    </div>
  )
}
