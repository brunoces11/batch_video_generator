export type FragmentStatus =
  | 'pending'
  | 'submitting'
  | 'processing'
  | 'polling'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'cancelled';

export type ProjectStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  total_fragments: number;
  completed_fragments: number;
  failed_fragments: number;
  gemini_api_key_hint: string | null;
  default_aspect_ratio: string;
  default_duration_seconds: number;
  default_resolution: string;
  reference_image_url: string | null;
  max_concurrent: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Fragment {
  id: string;
  project_id: string;
  sequence_order: number;
  prompt: string;
  aspect_ratio: string;
  duration_seconds: number;
  resolution: string;
  person_generation: string;
  status: FragmentStatus;
  veo_operation_name: string | null;
  video_url: string | null;
  video_uri: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  polling_started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeoutConfig {
  id: string;
  project_id: string;
  submission_timeout_ms: number;
  polling_interval_ms: number;
  polling_timeout_ms: number;
  max_total_batch_time_ms: number;
  rate_limit_base_delay_ms: number;
  rate_limit_max_delay_ms: number;
  rate_limit_max_retries: number;
  created_at: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  fragmentId?: string;
}

export interface VeoGenerateRequest {
  prompt: string;
  aspectRatio: string;
  durationSeconds: number;
  resolution: string;
  personGeneration: string;
  apiKey: string;
  model?: string;
  referenceImageUrl?: string;
}

export interface VeoGenerateResponse {
  operationName: string;
}

export interface VeoPollRequest {
  operationName: string;
  apiKey: string;
}

export interface VeoPollResponse {
  done: boolean;
  videoUrl: string | null;
  videoUri: string | null;
  raw: unknown;
}

export interface PromptInput {
  prompt: string;
  aspectRatio?: string;
  durationSeconds?: number;
  resolution?: string;
}

export interface ApiKeyEntry {
  id: string;
  label: string;
  api_key: string;
  is_default: boolean;
  created_at: string;
}
