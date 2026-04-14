import { useState } from 'react';
import { Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

function msToHuman(ms: number): string {
  if (ms >= 3600000) return `${(ms / 3600000).toFixed(1)}h`;
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const fields = [
  {
    key: 'submission_timeout_ms' as const,
    label: 'Submission Timeout',
    desc: 'Max time to submit a generation request',
    min: 5000,
    max: 120000,
    step: 1000,
  },
  {
    key: 'polling_interval_ms' as const,
    label: 'Polling Interval',
    desc: 'Time between poll checks',
    min: 3000,
    max: 60000,
    step: 1000,
  },
  {
    key: 'polling_timeout_ms' as const,
    label: 'Polling Timeout',
    desc: 'Max time to wait for a single video',
    min: 60000,
    max: 1800000,
    step: 30000,
  },
  {
    key: 'max_total_batch_time_ms' as const,
    label: 'Max Batch Time',
    desc: 'Maximum total batch runtime',
    min: 3600000,
    max: 172800000,
    step: 3600000,
  },
  {
    key: 'rate_limit_base_delay_ms' as const,
    label: 'Rate Limit Base Delay',
    desc: 'Initial backoff delay on rate limit',
    min: 500,
    max: 10000,
    step: 500,
  },
  {
    key: 'rate_limit_max_delay_ms' as const,
    label: 'Rate Limit Max Delay',
    desc: 'Maximum backoff delay',
    min: 5000,
    max: 300000,
    step: 5000,
  },
  {
    key: 'rate_limit_max_retries' as const,
    label: 'Rate Limit Max Retries',
    desc: 'Max retry attempts per rate-limited request',
    min: 1,
    max: 20,
    step: 1,
  },
];

export function TimeoutSettings() {
  const { timeoutConfig, updateTimeoutConfig, resetTimeoutDefaults, isProcessing } =
    useBatch();
  const [expanded, setExpanded] = useState(false);

  if (!timeoutConfig) return null;

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <CardTitle>Timeout Settings</CardTitle>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <div className="space-y-4">
          {fields.map((field) => {
            const value = timeoutConfig[field.key];
            const isTime = field.key !== 'rate_limit_max_retries';

            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <span className="text-xs text-gray-500 tabular-nums">
                    {isTime ? msToHuman(value) : `${value}x`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{field.desc}</p>
                <Input
                  type="number"
                  value={value}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  disabled={isProcessing}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (num >= field.min && num <= field.max) {
                      updateTimeoutConfig({ [field.key]: num });
                    }
                  }}
                />
              </div>
            );
          })}

          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={resetTimeoutDefaults}
            disabled={isProcessing}
          >
            Reset to Defaults
          </Button>
        </div>
      )}
    </Card>
  );
}
