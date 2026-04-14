import { supabase } from '../lib/supabase';
import type { Fragment, FragmentStatus, PromptInput } from '../lib/types';

export async function createFragments(
  projectId: string,
  prompts: PromptInput[],
  defaults: { aspectRatio: string; durationSeconds: number; resolution: string }
): Promise<Fragment[]> {
  const rows = prompts.map((p, i) => ({
    project_id: projectId,
    sequence_order: i + 1,
    prompt: p.prompt,
    aspect_ratio: p.aspectRatio || defaults.aspectRatio,
    duration_seconds: p.durationSeconds || defaults.durationSeconds,
    resolution: p.resolution || defaults.resolution,
  }));

  const { data, error } = await supabase.from('fragments').insert(rows).select();
  if (error) throw error;
  return data || [];
}

export async function getFragmentsByProject(projectId: string): Promise<Fragment[]> {
  const { data, error } = await supabase
    .from('fragments')
    .select('*')
    .eq('project_id', projectId)
    .order('sequence_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateFragmentStatus(
  id: string,
  status: FragmentStatus,
  extra?: Partial<Fragment>
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extra };
  const { error } = await supabase.from('fragments').update(update).eq('id', id);
  if (error) throw error;
}

export async function setFragmentOperation(
  id: string,
  operationName: string
): Promise<void> {
  const { error } = await supabase
    .from('fragments')
    .update({
      veo_operation_name: operationName,
      status: 'polling' as FragmentStatus,
      polling_started_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setFragmentCompleted(
  id: string,
  videoUrl: string,
  videoUri: string | null
): Promise<void> {
  const { error } = await supabase
    .from('fragments')
    .update({
      status: 'completed' as FragmentStatus,
      video_url: videoUrl,
      video_uri: videoUri,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setFragmentFailed(
  id: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase
    .from('fragments')
    .update({
      status: 'failed' as FragmentStatus,
      error_message: errorMessage,
      failed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function incrementRetryCount(id: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('fragments')
    .select('retry_count')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('fragments')
    .update({
      retry_count: (data?.retry_count || 0) + 1,
      status: 'pending' as FragmentStatus,
      error_message: null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function getNextPendingFragments(
  projectId: string,
  limit: number
): Promise<Fragment[]> {
  const { data, error } = await supabase
    .from('fragments')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .order('sequence_order', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function cancelPendingFragments(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('fragments')
    .update({ status: 'cancelled' as FragmentStatus })
    .eq('project_id', projectId)
    .in('status', ['pending']);
  if (error) throw error;
}
