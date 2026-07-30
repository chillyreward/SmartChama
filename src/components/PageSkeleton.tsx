'use client'

export default function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse" style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }} />
        <div className="h-10 w-32 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }} />
      </div>
      
      {/* Stats cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="h-3 w-20 rounded mb-3" style={{ backgroundColor: 'var(--bg-subtle)' }} />
            <div className="h-7 w-28 rounded" style={{ backgroundColor: 'var(--bg-subtle)' }} />
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--bg-subtle)' }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded" style={{ backgroundColor: 'var(--bg-subtle)' }} />
              <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--bg-subtle)' }} />
            </div>
            <div className="h-6 w-16 rounded" style={{ backgroundColor: 'var(--bg-subtle)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
