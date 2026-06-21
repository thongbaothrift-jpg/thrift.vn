export default function Loading() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="h-10 bg-zinc-100 rounded w-64 mb-10" />

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image skeleton */}
        <div className="aspect-[3/4] bg-zinc-100 rounded-lg" />

        {/* Info skeleton */}
        <div className="space-y-6">
          <div className="h-4 bg-zinc-100 rounded w-32" />
          <div className="h-10 bg-zinc-100 rounded w-3/4" />
          <div className="h-8 bg-zinc-100 rounded w-24" />

          <div className="border-t border-b border-zinc-200 py-8 space-y-4">
            <div className="h-5 bg-zinc-100 rounded w-48" />
            <div className="h-5 bg-zinc-100 rounded w-56" />
            <div className="h-5 bg-zinc-100 rounded w-40" />
          </div>

          <div className="h-24 bg-zinc-100 rounded" />

          <div className="h-14 bg-zinc-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
