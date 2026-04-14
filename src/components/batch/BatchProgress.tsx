import { useBatch } from '../../context/BatchContext';
import { ProgressBar } from '../ui/ProgressBar';
import { Card } from '../ui/Card';

export function BatchProgress() {
  const { fragments } = useBatch();

  const total = fragments.length;
  const completed = fragments.filter((f) => f.status === 'completed').length;
  const failed = fragments.filter(
    (f) => f.status === 'failed' || f.status === 'timed_out'
  ).length;
  const active = fragments.filter(
    (f) =>
      f.status === 'submitting' ||
      f.status === 'processing' ||
      f.status === 'polling'
  ).length;
  const pending = fragments.filter((f) => f.status === 'pending').length;
  const done = completed + failed;

  return (
    <Card>
      <div className="space-y-4">
        <ProgressBar value={done} max={total} color="bg-sky-500" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">
              {completed}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600 tabular-nums">
              {active}
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 tabular-nums">
              {pending}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500 tabular-nums">
              {failed}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
