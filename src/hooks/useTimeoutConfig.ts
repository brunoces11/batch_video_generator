import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_TIMEOUTS } from '../lib/constants';
import type { TimeoutConfig } from '../lib/types';

export function useTimeoutConfig(projectId: string | null) {
  const [config, setConfig] = useState<TimeoutConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setConfig(null);
      return;
    }

    let cancelled = false;

    async function loadOrCreate() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('timeout_configs')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (!cancelled) setConfig(data);
        } else {
          const { data: created, error: createError } = await supabase
            .from('timeout_configs')
            .insert({
              project_id: projectId,
              submission_timeout_ms: DEFAULT_TIMEOUTS.SUBMISSION_TIMEOUT_MS,
              polling_interval_ms: DEFAULT_TIMEOUTS.POLLING_INTERVAL_MS,
              polling_timeout_ms: DEFAULT_TIMEOUTS.POLLING_TIMEOUT_MS,
              max_total_batch_time_ms: DEFAULT_TIMEOUTS.MAX_TOTAL_BATCH_TIME_MS,
              rate_limit_base_delay_ms: DEFAULT_TIMEOUTS.RATE_LIMIT_BASE_DELAY_MS,
              rate_limit_max_delay_ms: DEFAULT_TIMEOUTS.RATE_LIMIT_MAX_DELAY_MS,
              rate_limit_max_retries: DEFAULT_TIMEOUTS.RATE_LIMIT_MAX_RETRIES,
            })
            .select()
            .single();

          if (createError) throw createError;
          if (!cancelled) setConfig(created);
        }
      } catch (err) {
        console.error('Failed to load timeout config:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrCreate();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const updateConfig = useCallback(
    async (updates: Partial<TimeoutConfig>) => {
      if (!config) return;

      const { error } = await supabase
        .from('timeout_configs')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;
      setConfig((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [config]
  );

  const resetToDefaults = useCallback(async () => {
    if (!config) return;

    const defaults = {
      submission_timeout_ms: DEFAULT_TIMEOUTS.SUBMISSION_TIMEOUT_MS,
      polling_interval_ms: DEFAULT_TIMEOUTS.POLLING_INTERVAL_MS,
      polling_timeout_ms: DEFAULT_TIMEOUTS.POLLING_TIMEOUT_MS,
      max_total_batch_time_ms: DEFAULT_TIMEOUTS.MAX_TOTAL_BATCH_TIME_MS,
      rate_limit_base_delay_ms: DEFAULT_TIMEOUTS.RATE_LIMIT_BASE_DELAY_MS,
      rate_limit_max_delay_ms: DEFAULT_TIMEOUTS.RATE_LIMIT_MAX_DELAY_MS,
      rate_limit_max_retries: DEFAULT_TIMEOUTS.RATE_LIMIT_MAX_RETRIES,
    };

    const { error } = await supabase
      .from('timeout_configs')
      .update(defaults)
      .eq('id', config.id);

    if (error) throw error;
    setConfig((prev) => (prev ? { ...prev, ...defaults } : null));
  }, [config]);

  return { config, loading, updateConfig, resetToDefaults };
}
