import { PageHeroSkeleton, PageContentSkeleton } from '@/components/PageLoadingSkeleton'

export default function Loading() {
  return (
    <div className="bg-background">
      <PageHeroSkeleton />
      <PageContentSkeleton lines={8} />
    </div>
  )
}
