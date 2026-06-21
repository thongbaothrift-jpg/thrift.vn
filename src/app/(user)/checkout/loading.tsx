export default function CheckoutLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="h-4 bg-zinc-100 rounded w-48 mb-8" />

      {/* Stepper skeleton */}
      <div className="flex justify-center gap-8 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full ${i === 1 ? "bg-black" : "bg-zinc-200"}`} />
            <div className="h-4 bg-zinc-100 rounded w-16" />
            {i < 3 && <div className="w-12 h-px bg-zinc-200" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 rounded" />
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-200 p-8 space-y-4">
            <div className="h-6 bg-zinc-100 rounded w-32" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-16 h-20 bg-zinc-100 rounded" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
