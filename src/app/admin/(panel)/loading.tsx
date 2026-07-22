/**
 * Admin route-segment loading UI — instant feedback while a panel page's
 * server data loads. Matches the dark admin chrome (slate) to avoid a flash.
 */
export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-slate-700/50" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-800/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-800/60 border border-slate-700/40" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-700/40" />
    </div>
  )
}
