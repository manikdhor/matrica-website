import type { CSSProperties } from 'react'

export function SkeletonBox({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] ${className}`}
      style={style}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-100 overflow-hidden ${className}`}>
      <SkeletonBox className="h-48 w-full" />
      <div className="p-5 space-y-3">
        <SkeletonBox className="h-3 w-20" />
        <SkeletonBox className="h-6 w-3/4" />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

export function SkeletonHero({ className = '' }: { className?: string }) {
  return (
    <div className={`relative min-h-[85vh] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-6">
          <SkeletonBox className="h-4 w-48" />
          <SkeletonBox className="h-12 md:h-16 w-full" />
          <SkeletonBox className="h-12 md:h-16 w-4/5" />
          <SkeletonBox className="h-5 w-96 max-w-full" />
          <div className="flex gap-4 pt-4">
            <SkeletonBox className="h-12 w-40 rounded-full" />
            <SkeletonBox className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}