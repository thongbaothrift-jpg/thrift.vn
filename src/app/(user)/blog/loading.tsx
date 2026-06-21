export default function BlogLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      {/* Header skeleton */}
      <div className="mb-16">
        <div className="h-12 bg-zinc-100 rounded w-80 mb-4" />
        <div className="h-4 bg-zinc-100 rounded w-96" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-video bg-zinc-100 rounded-lg" />
            <div className="h-3 bg-zinc-100 rounded w-20" />
            <div className="h-6 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-full" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
