export default function AdminLoading() {
  return (
    <div className="space-y-4">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-200 rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-zinc-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-zinc-100 rounded-xl animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 flex-1 max-w-sm bg-zinc-100 rounded-xl animate-pulse" />
        <div className="h-10 w-36 bg-zinc-100 rounded-xl animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 px-6 py-4 bg-zinc-50/50 border-b border-zinc-100">
          {[100, 80, 60, 60, 60, 80, 80].map((w, i) => (
            <div key={i} className="h-3 bg-zinc-200 rounded animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-zinc-50 last:border-0">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-zinc-100 rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-zinc-50 rounded animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-zinc-100 rounded animate-pulse" />
            <div className="h-6 w-20 bg-zinc-100 rounded-full animate-pulse" />
            <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
            <div className="flex gap-2 ml-auto">
              <div className="w-8 h-8 bg-zinc-100 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-zinc-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
