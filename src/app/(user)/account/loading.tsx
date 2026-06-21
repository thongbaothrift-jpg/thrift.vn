export default function AccountLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <div className="h-10 bg-zinc-100 rounded w-64 mb-2" />
          <div className="h-4 bg-zinc-100 rounded w-32" />
        </div>
        <div className="h-10 bg-zinc-100 rounded w-28" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-8 border-b border-zinc-200 mb-12 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 bg-zinc-100 rounded w-24" />
        ))}
      </div>

      {/* Orders skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-zinc-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-6">
                <div className="h-4 bg-zinc-100 rounded w-32" />
                <div className="h-4 bg-zinc-100 rounded w-24" />
                <div className="h-4 bg-zinc-100 rounded w-28" />
              </div>
              <div className="h-6 bg-zinc-100 rounded w-20" />
            </div>
            <div className="flex gap-4">
              <div className="w-16 h-20 bg-zinc-100 rounded" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-4 bg-zinc-100 rounded w-48" />
                <div className="h-3 bg-zinc-100 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
