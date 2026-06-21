export default function ShopLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      {/* Header skeleton */}
      <div className="mb-16">
        <div className="h-12 bg-zinc-100 rounded w-80 mb-4" />
        <div className="h-4 bg-zinc-100 rounded w-96" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-4 mb-12 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-zinc-100 rounded w-28 flex-shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-zinc-100 rounded-lg" />
            <div className="h-3 bg-zinc-100 rounded w-16" />
            <div className="h-4 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
