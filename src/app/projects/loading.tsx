import { PageHeroSkeleton, ProjectGridSkeleton } from '@/components/PageLoadingSkeleton'

export default function Loading() {
  return (
    <div className="bg-[#FBFAF7]">
      <PageHeroSkeleton />
      <ProjectGridSkeleton count={6} />
    </div>
  )
}
