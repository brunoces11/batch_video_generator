export const DEFAULT_TIMEOUTS = {
  SUBMISSION_TIMEOUT_MS: 30_000,
  POLLING_INTERVAL_MS: 10_000,
  POLLING_TIMEOUT_MS: 360_000,
  MAX_TOTAL_BATCH_TIME_MS: 86_400_000,
  RATE_LIMIT_BASE_DELAY_MS: 1_000,
  RATE_LIMIT_MAX_DELAY_MS: 60_000,
  RATE_LIMIT_MAX_RETRIES: 5,
} as const;

export const VEO_DEFAULTS = {
  ASPECT_RATIO: '16:9',
  DURATION_SECONDS: 8,
  RESOLUTION: '720p',
  PERSON_GENERATION: 'allow_adult',
  MAX_CONCURRENT: 3,
  MODEL: 'veo-3.1-generate-preview',
} as const;

export const ASPECT_RATIOS = ['16:9', '9:16'] as const;
export const RESOLUTIONS = ['720p', '1080p'] as const;
export const DURATIONS = [4, 6, 8] as const;
export const MAX_CONCURRENT_OPTIONS = [1, 2, 3, 4, 5] as const;

export const VEO_MODELS = [
  { value: 'veo-3.1-generate-preview', label: 'Veo 3.1' },
  { value: 'veo-3.0-generate-preview', label: 'Veo 3.0' },
  { value: 'veo-2.0-generate-001', label: 'Veo 2.0' },
] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  submitting: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  polling: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  timed_out: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  paused: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};
