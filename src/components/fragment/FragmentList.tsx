import { useState } from 'react';
import { useBatch } from '../../context/BatchContext';
import { FragmentCard } from './FragmentCard';
import { incrementRetryCount } from '../../services/fragmentService';
import type { FragmentStatus } from '../../lib/types';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const ACTIVE_STATUSES: FragmentStatus[] = ['submitting', 'processing', 'polling'];
const FAILED_STATUSES: FragmentStatus[] = ['failed', 'timed_out'];

export function FragmentList() {
  const { fragments, setFragments } = useBatch();
  const [filter, setFilter] = useState('all');

  const filtered = fragments.filter((f) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE_STATUSES.includes(f.status);
    if (filter === 'failed') return FAILED_STATUSES.includes(f.status);
    return f.status === filter;
  });

  const handleRetry = async (id: string) => {
    await incrementRetryCount(id);
    setFragments((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: 'pending' as FragmentStatus, error_message: null }
          : f
      )
    );
  };

  const counts = {
    all: fragments.length,
    pending: fragments.filter((f) => f.status === 'pending').length,
    active: fragments.filter((f) => ACTIVE_STATUSES.includes(f.status)).length,
    completed: fragments.filter((f) => f.status === 'completed').length,
    failed: fragments.filter((f) => FAILED_STATUSES.includes(f.status)).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
              transition-colors duration-150
              ${
                filter === opt.value
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {opt.label} ({counts[opt.value as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((fragment) => (
          <FragmentCard
            key={fragment.id}
            fragment={fragment}
            onRetry={handleRetry}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">
            No expansions match this filter
          </div>
        )}
      </div>
    </div>
  );
}
