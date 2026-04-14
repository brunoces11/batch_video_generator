import { useEffect, useRef } from 'react';
import { useBatch } from '../../context/BatchContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';

const levelColors = {
  info: 'text-gray-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
  success: 'text-emerald-600',
};

const levelDots = {
  info: 'bg-gray-400',
  warn: 'bg-amber-400',
  error: 'bg-red-400',
  success: 'bg-emerald-400',
};

export function BatchLog() {
  const { logEntries } = useBatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logEntries.length]);

  return (
    <Card padding={false}>
      <div className="px-5 pt-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <span className="text-xs text-gray-400">
              {logEntries.length} entries
            </span>
          </div>
        </CardHeader>
      </div>

      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto px-5 pb-4 scroll-smooth"
      >
        {logEntries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Log entries will appear here once processing starts
          </p>
        ) : (
          <div className="space-y-1">
            {logEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 tabular-nums whitespace-nowrap font-mono">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${levelDots[entry.level]}`}
                />
                <span className={levelColors[entry.level]}>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
