/*
  # Create core tables for Veo Batch Video Automation

  1. New Types
    - `fragment_status` enum: pending, submitting, processing, polling, completed, failed, timed_out, cancelled
    - `project_status` enum: draft, running, paused, completed, failed

  2. New Tables
    - `projects`: Batch video generation projects
      - `id` (uuid, primary key)
      - `name` (text) - project name
      - `status` (project_status) - current state
      - `total_fragments` / `completed_fragments` / `failed_fragments` (integer) - counters
      - `gemini_api_key_hint` (text) - last 4 chars for display
      - `default_aspect_ratio` / `default_duration_seconds` / `default_resolution` - defaults
      - `max_concurrent` (integer) - max concurrent fragment processing
      - Timestamps: created_at, updated_at, started_at, completed_at

    - `fragments`: Individual video generation tasks
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects)
      - `sequence_order` (integer) - order in batch
      - `prompt` (text) - video generation prompt
      - Video params: aspect_ratio, duration_seconds, resolution, person_generation
      - `status` (fragment_status) - current state
      - `veo_operation_name` (text) - Gemini operation ID for polling
      - `video_url` / `video_uri` (text) - generated video URLs
      - `error_message` (text) - error details
      - `retry_count` / `max_retries` (integer) - retry tracking
      - Timestamps: polling_started_at, submitted_at, completed_at, failed_at, created_at, updated_at

    - `timeout_configs`: Per-project timeout settings
      - `id` (uuid, primary key)
      - `project_id` (uuid, FK to projects)
      - All timeout values in milliseconds with sensible defaults

  3. Security
    - RLS enabled on all tables
    - Permissive policies for anon access (no auth required)

  4. Other
    - Auto-update trigger for updated_at columns
    - Indexes on frequently queried columns
    - Realtime enabled for projects and fragments
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fragment_status') THEN
    CREATE TYPE fragment_status AS ENUM (
      'pending', 'submitting', 'processing', 'polling',
      'completed', 'failed', 'timed_out', 'cancelled'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM (
      'draft', 'running', 'paused', 'completed', 'failed'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Untitled Batch',
  status project_status NOT NULL DEFAULT 'draft',
  total_fragments integer NOT NULL DEFAULT 0,
  completed_fragments integer NOT NULL DEFAULT 0,
  failed_fragments integer NOT NULL DEFAULT 0,
  gemini_api_key_hint text,
  default_aspect_ratio text NOT NULL DEFAULT '16:9',
  default_duration_seconds integer NOT NULL DEFAULT 8,
  default_resolution text NOT NULL DEFAULT '720p',
  max_concurrent integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  prompt text NOT NULL,
  aspect_ratio text NOT NULL DEFAULT '16:9',
  duration_seconds integer NOT NULL DEFAULT 8,
  resolution text NOT NULL DEFAULT '720p',
  person_generation text NOT NULL DEFAULT 'allow_adult',
  status fragment_status NOT NULL DEFAULT 'pending',
  veo_operation_name text,
  video_url text,
  video_uri text,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  polling_started_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.timeout_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submission_timeout_ms integer NOT NULL DEFAULT 30000,
  polling_interval_ms integer NOT NULL DEFAULT 10000,
  polling_timeout_ms integer NOT NULL DEFAULT 360000,
  max_total_batch_time_ms integer NOT NULL DEFAULT 86400000,
  rate_limit_base_delay_ms integer NOT NULL DEFAULT 1000,
  rate_limit_max_delay_ms integer NOT NULL DEFAULT 60000,
  rate_limit_max_retries integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fragments_project_id ON public.fragments(project_id);
CREATE INDEX IF NOT EXISTS idx_fragments_status ON public.fragments(status);
CREATE INDEX IF NOT EXISTS idx_fragments_project_status ON public.fragments(project_id, status);
CREATE INDEX IF NOT EXISTS idx_timeout_configs_project_id ON public.timeout_configs(project_id);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'projects_updated_at' AND event_object_table = 'projects'
  ) THEN
    CREATE TRIGGER projects_updated_at
      BEFORE UPDATE ON public.projects
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'fragments_updated_at' AND event_object_table = 'fragments'
  ) THEN
    CREATE TRIGGER fragments_updated_at
      BEFORE UPDATE ON public.fragments
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeout_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Projects are viewable by everyone'
  ) THEN
    CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Projects are insertable by everyone'
  ) THEN
    CREATE POLICY "Projects are insertable by everyone" ON public.projects FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Projects are updatable by everyone'
  ) THEN
    CREATE POLICY "Projects are updatable by everyone" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Projects are deletable by everyone'
  ) THEN
    CREATE POLICY "Projects are deletable by everyone" ON public.projects FOR DELETE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fragments' AND policyname = 'Fragments are viewable by everyone'
  ) THEN
    CREATE POLICY "Fragments are viewable by everyone" ON public.fragments FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fragments' AND policyname = 'Fragments are insertable by everyone'
  ) THEN
    CREATE POLICY "Fragments are insertable by everyone" ON public.fragments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fragments' AND policyname = 'Fragments are updatable by everyone'
  ) THEN
    CREATE POLICY "Fragments are updatable by everyone" ON public.fragments FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fragments' AND policyname = 'Fragments are deletable by everyone'
  ) THEN
    CREATE POLICY "Fragments are deletable by everyone" ON public.fragments FOR DELETE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'timeout_configs' AND policyname = 'Timeout configs are viewable by everyone'
  ) THEN
    CREATE POLICY "Timeout configs are viewable by everyone" ON public.timeout_configs FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'timeout_configs' AND policyname = 'Timeout configs are insertable by everyone'
  ) THEN
    CREATE POLICY "Timeout configs are insertable by everyone" ON public.timeout_configs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'timeout_configs' AND policyname = 'Timeout configs are updatable by everyone'
  ) THEN
    CREATE POLICY "Timeout configs are updatable by everyone" ON public.timeout_configs FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'timeout_configs' AND policyname = 'Timeout configs are deletable by everyone'
  ) THEN
    CREATE POLICY "Timeout configs are deletable by everyone" ON public.timeout_configs FOR DELETE USING (true);
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fragments;