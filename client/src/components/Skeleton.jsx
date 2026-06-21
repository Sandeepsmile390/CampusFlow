import React from 'react';

// Base pulse skeleton block
export function Skeleton({ className = '', variant = 'text' }) {
  const baseClass = "skeleton-pulse bg-slate-200/50 dark:bg-slate-800/40 rounded-xl";
  const variantClasses = {
    text: 'h-4 w-3/4',
    title: 'h-6 w-1/2',
    circle: 'rounded-full',
    rect: 'w-full h-full'
  }[variant] || '';

  return <div className={`${baseClass} ${variantClasses} ${className}`} />;
}

// Stats Card Grid Skeleton (4 cards)
export function SkeletonCardGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-3 w-2/3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

// Table Skeleton (configurable rows/cols)
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="custom-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Skeleton className="h-3.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Chart Skeleton (to match bar/line charts)
export function SkeletonChart({ height = 'h-64' }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-5 w-1/4 mb-4" />
      <div className={`flex items-end justify-between gap-4 ${height} pt-4`}>
        {Array.from({ length: 6 }).map((_, i) => {
          const heights = ['h-1/3', 'h-2/3', 'h-1/2', 'h-3/4', 'h-2/5', 'h-5/6'];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <Skeleton className={`${heights[i]} w-full rounded-t-lg`} />
              <Skeleton className="h-3 w-8" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// List/Upcoming Items Skeleton
export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/40 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}
