import { SkeletonBox } from '@/components/SkeletonPulse'

export default function Loading() {
  return (
    <div className="bg-background">
      <SkeletonBox className="h-[45vh] min-h-[360px] w-full rounded-none" />
      <div className="py-16 max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        <SkeletonBox className="h-3 w-32" />
        <SkeletonBox className="h-10 w-3/4" />
        <SkeletonBox className="h-4 w-40" />
        <div className="pt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBox key={i} className="h-4" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
