'use client';

export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-[var(--border)] rounded w-1/3 mb-4" />
      <div className="h-8 bg-[var(--border)] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[var(--border)] rounded w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 bg-[var(--border)] border-b border-[var(--border)]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 border-b border-[var(--border)] flex items-center gap-4 px-4">
          <div className="h-4 bg-[var(--border)] rounded w-1/4" />
          <div className="h-4 bg-[var(--border)] rounded w-1/6" />
          <div className="h-4 bg-[var(--border)] rounded w-1/5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable />
    </div>
  );
}
