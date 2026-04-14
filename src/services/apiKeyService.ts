import { supabase } from '../lib/supabase';
import type { ApiKeyEntry } from '../lib/types';

export async function listApiKeys(): Promise<ApiKeyEntry[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addApiKey(label: string, apiKey: string): Promise<ApiKeyEntry> {
  const { data, error } = await supabase
    .from('api_keys')
    .insert({ label, api_key: apiKey })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteApiKey(id: string): Promise<void> {
  const { error } = await supabase.from('api_keys').delete().eq('id', id);
  if (error) throw error;
}

export async function setDefaultApiKey(id: string): Promise<void> {
  const { error: clearError } = await supabase
    .from('api_keys')
    .update({ is_default: false })
    .neq('id', id);

  if (clearError) throw clearError;

  const { error } = await supabase
    .from('api_keys')
    .update({ is_default: true })
    .eq('id', id);

  if (error) throw error;
}

export async function seedApiKeyFromEnv(): Promise<void> {
  const envKey = import.meta.env.VITE_VEO_API;
  if (!envKey) return;

  const { data } = await supabase
    .from('api_keys')
    .select('id')
    .eq('api_key', envKey)
    .maybeSingle();

  if (data) return;

  await supabase
    .from('api_keys')
    .insert({ label: 'VEO_API', api_key: envKey, is_default: true });
}
