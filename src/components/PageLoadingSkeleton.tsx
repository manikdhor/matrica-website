'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function PageHeroSkeleton() {
  return (
    <div className="h-[40vh] min-h-[320px] bg-[#F8FAFB] animate-pulse flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-4 w-24 mx-auto bg-[#F1F5F9]" />
        <Skeleton className="h-12 w-72 mx-auto bg-[#F1F5F9]" />
        <Skeleton className="h-4 w-48 mx-auto bg-[#F1F5F9]" />
      </div>
    </div>
  )
}

export function PageContentSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
      <Skeleton className="h-8 w-64 bg-[#F1F5F9] mb-6" />
      <div className="gold-line mb-8" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 bg-[#F1F5F9]"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <Skeleton className="h-48 w-full bg-[#F1F5F9]" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-32 bg-[#F1F5F9]" />
        <Skeleton className="h-3 w-24 bg-[#F1F5F9]" />
        <Skeleton className="h-3 w-full bg-[#F1F5F9]" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full bg-[#F1F5F9]" />
          <Skeleton className="h-5 w-24 rounded-full bg-[#F1F5F9]" />
          <Skeleton className="h-5 w-16 rounded-full bg-[#F1F5F9]" />
        </div>
      </div>
    </div>
  )
}

export function ProjectGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14 space-y-3">
        <Skeleton className="h-10 w-64 mx-auto bg-[#F1F5F9]" />
        <Skeleton className="h-4 w-96 mx-auto bg-[#F1F5F9]" />
        <div className="gold-line max-w-[120px] mx-auto mt-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}