import { supabase } from '../lib/supabase';
import type { Project, ProjectStatus } from '../lib/types';

export async function createProject(
  name: string,
  defaults: {
    aspectRatio: string;
    durationSeconds: number;
    resolution: string;
    maxConcurrent: number;
    apiKeyHint: string;
    referenceImageUrl?: string;
  }
): Promise<Project> {
  const row: Record<string, unknown> = {
    name,
    default_aspect_ratio: defaults.aspectRatio,
    default_duration_seconds: defaults.durationSeconds,
    default_resolution: defaults.resolution,
    max_concurrent: defaults.maxConcurrent,
    gemini_api_key_hint: defaults.apiKeyHint,
  };
  if (defaults.referenceImageUrl) {
    row.reference_image_url = defaults.referenceImageUrl;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
  extra?: Partial<Project>
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extra };
  if (status === 'running' && !extra?.started_at) {
    update.started_at = new Date().toISOString();
  }
  if ((status === 'completed' || status === 'failed') && !extra?.completed_at) {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('projects').update(update).eq('id', id);
  if (error) throw error;
}

export async function updateProjectCounts(id: string): Promise<void> {
  const { data: fragments, error } = await supabase
    .from('fragments')
    .select('status')
    .eq('project_id', id);

  if (error) throw error;

  const total = fragments?.length || 0;
  const completed = fragments?.filter((f) => f.status === 'completed').length || 0;
  const failed =
    fragments?.filter((f) => f.status === 'failed' || f.status === 'timed_out').length || 0;

  const { error: updateError } = await supabase
    .from('projects')
    .update({ total_fragments: total, completed_fragments: completed, failed_fragments: failed })
    .eq('id', id);

  if (updateError) throw updateError;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
