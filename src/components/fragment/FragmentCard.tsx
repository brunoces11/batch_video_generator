import { Download, RotateCcw } from 'lucide-react';
import { FragmentStatusBadge } from './FragmentStatusBadge';
import { Button } from '../ui/Button';
import type { Fragment } from '../../lib/types';

interface Props {
  fragment: Fragment;
  onRetry?: (id: string) => void;
}

export function FragmentCard({ fragment, onRetry }: Props) {
  const isActive =
    fragment.status === 'submitting' ||
    fragment.status === 'processing' ||
    fragment.status === 'polling';

  return (
    <div
      className={`
        rounded-lg border bg-white p-4 transition-all duration-300
        ${isActive ? 'border-sky-200 shadow-sm ring-1 ring-sky-100' : 'border-gray-200'}
        ${fragment.status === 'completed' ? 'border-emerald-200' : ''}
        ${fragment.status === 'failed' || fragment.status === 'timed_out' ? 'border-red-200' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-gray-400">
              #{fragment.sequence_order}
            </span>
            <FragmentStatusBadge status={fragment.status} />
            {fragment.retry_count > 0 && (
              <span className="text-xs text-gray-400">
                retry {fragment.retry_count}/{fragment.max_retries}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-800 line-clamp-2 mb-2">
            {fragment.prompt}
          </p>

          {fragment.error_message && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-2">
              {fragment.error_message}
            </p>
          )}

          {fragment.video_url && (
            <div className="mt-3">
              <video
                src={fragment.video_url}
                controls
                className="w-full max-w-md rounded-lg bg-gray-900"
                preload="metadata"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {fragment.video_url && (
            <a
              href={fragment.video_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
          {(fragment.status === 'failed' || fragment.status === 'timed_out') &&
            onRetry && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => onRetry(fragment.id)}
              />
            )}
        </div>
      </div>

      {fragment.completed_at && fragment.submitted_at && (
        <div className="mt-2 text-xs text-gray-400">
          {Math.round(
            (new Date(fragment.completed_at).getTime() -
              new Date(fragment.submitted_at).getTime()) /
              1000
          )}
          s
        </div>
      )}
    </div>
  );
}
