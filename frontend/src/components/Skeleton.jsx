import React from 'react';

export function SkeletonText({ width = '100%', style }) {
  return <div className="skeleton skeleton-text" style={{ width, ...style }} />;
}

export function SkeletonTitle({ width = '60%' }) {
  return <div className="skeleton skeleton-title" style={{ width }} />;
}

export function SkeletonHero() {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        className="skeleton"
        style={{
          height: 160,
          borderRadius: 'var(--radius-2xl)',
        }}
      />
    </div>
  );
}

export function SkeletonStatsGrid() {
  return (
    <div className="stats-grid" style={{ marginBottom: 24 }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="stat-card">
          <div className="flex justify-between items-center mb-4">
            <div className="skeleton skeleton-text" style={{ width: 80 }} />
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
          <div className="skeleton skeleton-hero" style={{ width: 80, height: 36 }} />
          <div className="skeleton skeleton-text mt-2" style={{ width: 100 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ padding: '0 0 8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 16,
            padding: '14px 16px',
            borderBottom: '1px solid var(--gray-100)',
            alignItems: 'center',
          }}
        >
          <div className="skeleton skeleton-text" style={{ width: 60, flexShrink: 0 }} />
          <div className="skeleton skeleton-text" style={{ width: 120 }} />
          <div className="skeleton skeleton-text" style={{ flex: 1 }} />
          <div className="skeleton skeleton-text" style={{ width: 80, flexShrink: 0 }} />
          <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 99 }} />
        </div>
      ))}
    </div>
  );
}
