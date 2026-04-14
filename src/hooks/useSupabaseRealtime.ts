import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Fragment, Project } from '../lib/types';

interface RealtimeCallbacks {
  onProjectUpdate?: (project: Project) => void;
  onFragmentUpdate?: (fragment: Fragment) => void;
  onFragmentInsert?: (fragment: Fragment) => void;
}

export function useSupabaseRealtime(
  projectId: string | null,
  callbacks: RealtimeCallbacks
) {
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          callbacks.onProjectUpdate?.(payload.new as Project);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fragments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacks.onFragmentUpdate?.(payload.new as Fragment);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fragments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacks.onFragmentInsert?.(payload.new as Fragment);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, callbacks]);
}
