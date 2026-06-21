export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-zinc-200 mb-5" />
      <div className="space-y-2">
        <div className="h-3 bg-zinc-200 w-16" />
        <div className="h-4 bg-zinc-200 w-3/4" />
        <div className="h-4 bg-zinc-200 w-20" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-32 bg-zinc-200" />
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-zinc-200 w-20" />
          <div className="h-4 bg-zinc-200 w-3/4" />
          <div className="h-4 bg-zinc-200 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="h-10 bg-zinc-200 w-64 mb-12" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Sell page skeleton - matches static gradient design
export function SellPageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Header */}
      <header className="bg-white/80 sticky top-0 z-50 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="h-8 bg-zinc-200 w-32" />
          <div className="flex items-center gap-8">
            <div className="h-5 bg-zinc-200 w-20" />
            <div className="h-6 w-6 bg-zinc-200 rounded-full" />
          </div>
        </div>
      </header>

      {/* Hero with Static Gradient */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, rgba(254,205,211,0.4) 0%, rgba(254,205,211,0.15) 20%, rgba(254,205,211,0.05) 40%, transparent 70%, white 100%)'
          }}
        />
        <div className="relative max-w-2xl mx-auto px-8 text-center py-32">
          <div className="h-4 bg-zinc-200 w-48 mx-auto mb-6" />
          <div className="h-16 bg-zinc-200 w-96 mx-auto mb-6" />
          <div className="h-6 bg-zinc-200 w-96 mx-auto mb-12" />
          <div className="h-14 bg-zinc-200 w-40 mx-auto" />
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="h-4 bg-zinc-200 w-48 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-8 border border-zinc-100">
                <div className="w-16 h-16 bg-zinc-50 rounded-full mx-auto mb-6" />
                <div className="h-12 bg-zinc-100 w-12 mx-auto mb-4" />
                <div className="h-4 bg-zinc-200 w-24 mx-auto mb-3" />
                <div className="h-3 bg-zinc-200 w-full mb-2" />
                <div className="h-3 bg-zinc-200 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24 px-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="h-4 bg-zinc-200 w-48 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-10 text-center border border-zinc-100">
                <div className="w-16 h-16 bg-red-50 rounded-full mx-auto mb-5" />
                <div className="h-4 bg-zinc-200 w-32 mx-auto mb-2" />
                <div className="h-3 bg-zinc-200 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Blog page skeleton
export function BlogPageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-16 animate-pulse">
      <div className="max-w-2xl mx-auto text-center mb-16">
        <div className="h-12 bg-zinc-200 w-64 mx-auto mb-6" />
        <div className="h-6 bg-zinc-200 w-96 mx-auto" />
      </div>
      {/* Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="aspect-[4/3] bg-zinc-200" />
        <div className="flex flex-col justify-center">
          <div className="h-3 bg-zinc-200 w-20 mb-3" />
          <div className="h-8 bg-zinc-200 w-full mb-3" />
          <div className="h-6 bg-zinc-200 w-3/4 mb-4" />
          <div className="h-4 bg-zinc-200 w-full mb-2" />
          <div className="h-4 bg-zinc-200 w-2/3 mb-4" />
          <div className="h-3 bg-zinc-200 w-32" />
        </div>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] bg-zinc-200 mb-4" />
            <div className="h-3 bg-zinc-200 w-20 mb-2" />
            <div className="h-5 bg-zinc-200 w-full mb-2" />
            <div className="h-3 bg-zinc-200 w-full mb-2" />
            <div className="h-3 bg-zinc-200 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Blog post skeleton
export function BlogPostSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16 animate-pulse">
      <div className="h-4 bg-zinc-200 w-48 mb-8" />
      <div className="h-3 bg-zinc-200 w-20 mb-3" />
      <div className="h-10 bg-zinc-200 w-full mb-6" />
      <div className="h-10 bg-zinc-200 w-3/4 mb-8" />
      <div className="flex gap-6 mb-12">
        <div className="h-4 bg-zinc-200 w-20" />
        <div className="h-4 bg-zinc-200 w-32" />
        <div className="h-4 bg-zinc-200 w-16" />
      </div>
      <div className="aspect-[16/9] bg-zinc-200 mb-12 -mx-8" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-zinc-200 w-full" />
        ))}
        <div className="h-4 bg-zinc-200 w-3/4" />
      </div>
    </div>
  );
}

// Contact page skeleton
export function ContactPageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-16 animate-pulse">
      <div className="max-w-2xl mx-auto text-center mb-16">
        <div className="h-12 bg-zinc-200 w-64 mx-auto mb-6" />
        <div className="h-6 bg-zinc-200 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <div className="h-6 bg-zinc-200 w-32 mb-8" />
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-zinc-200 w-20 mb-2" />
                  <div className="h-4 bg-zinc-200 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-6 bg-zinc-200 w-32 mb-8" />
          <div className="space-y-6">
            <div className="h-12 bg-zinc-200" />
            <div className="h-12 bg-zinc-200" />
            <div className="h-12 bg-zinc-200" />
            <div className="h-32 bg-zinc-200" />
            <div className="h-12 bg-zinc-200 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
