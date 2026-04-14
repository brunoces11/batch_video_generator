import { useBatch } from '../../context/BatchContext';
import { BatchProgress } from './BatchProgress';
import { BatchControls } from './BatchControls';
import { BatchLog } from './BatchLog';
import { FragmentList } from '../fragment/FragmentList';
import { TimeoutSettings } from '../settings/TimeoutSettings';

export function BatchDashboard() {
  const { apiKey, project, isProcessing } = useBatch();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {project?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {project?.total_fragments} video expansion{project?.total_fragments !== 1 ? 's' : ''}
          </p>
        </div>
        <BatchControls />
      </div>

      <BatchProgress />

      {!apiKey && !isProcessing && project?.status !== 'completed' && (
        <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Enter your Gemini API Key in the top bar to start processing
          {project?.gemini_api_key_hint
            ? ` (previously used key ending in ...${project.gemini_api_key_hint})`
            : ''}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FragmentList />
        </div>
        <div className="space-y-6">
          <BatchLog />
          <TimeoutSettings />
        </div>
      </div>
    </div>
  );
}
