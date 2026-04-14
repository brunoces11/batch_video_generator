import { useBatch } from '../../context/BatchContext';

export function Footer() {
  const { fragments, isProcessing, project } = useBatch();

  if (!project || fragments.length === 0) return null;

  const completed = fragments.filter((f) => f.status === 'completed').length;
  const failed = fragments.filter(
    (f) => f.status === 'failed' || f.status === 'timed_out'
  ).length;
  const pending = fragments.filter((f) => f.status === 'pending').length;
  const active = fragments.filter(
    (f) =>
      f.status === 'submitting' ||
      f.status === 'processing' ||
      f.status === 'polling'
  ).length;

  return (
    <footer className="sticky bottom-0 z-30 bg-white/80 backdrop-blur-md border-t border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              Expansions: <strong className="text-gray-900">{fragments.length}</strong>
            </span>
            <span>
              Completed: <strong className="text-emerald-600">{completed}</strong>
            </span>
            <span>
              Failed: <strong className="text-red-600">{failed}</strong>
            </span>
            {active > 0 && (
              <span>
                Active: <strong className="text-sky-600">{active}</strong>
              </span>
            )}
            {pending > 0 && (
              <span>
                Pending: <strong className="text-gray-500">{pending}</strong>
              </span>
            )}
          </div>
          {isProcessing && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
              </span>
              <span className="text-sky-600 font-medium">Processing</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
