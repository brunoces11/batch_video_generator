import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { useFragmentProcessor } from '../hooks/useFragmentProcessor';
import { useTimeoutConfig } from '../hooks/useTimeoutConfig';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import { useApiKeys } from '../hooks/useApiKeys';
import type { Project, Fragment, LogEntry, TimeoutConfig, ApiKeyEntry } from '../lib/types';

interface BatchContextValue {
  project: Project | null;
  setProject: (p: Project | null) => void;
  fragments: Fragment[];
  setFragments: React.Dispatch<React.SetStateAction<Fragment[]>>;
  apiKey: string;
  apiKeys: ApiKeyEntry[];
  selectedKeyId: string | null;
  apiKeysLoading: boolean;
  selectApiKey: (id: string) => void;
  addApiKey: (label: string, key: string) => Promise<ApiKeyEntry>;
  removeApiKey: (id: string) => Promise<void>;
  model: string;
  setModel: (m: string) => void;
  timeoutConfig: TimeoutConfig | null;
  timeoutLoading: boolean;
  updateTimeoutConfig: (updates: Partial<TimeoutConfig>) => Promise<void>;
  resetTimeoutDefaults: () => Promise<void>;
  isProcessing: boolean;
  isPaused: boolean;
  activeIds: Set<string>;
  wakeLock: {
    isSupported: boolean;
    isActive: boolean;
    error: string | null;
  };
  logEntries: LogEntry[];
  startBatch: () => Promise<void>;
  pauseBatch: () => void;
  resumeBatch: () => void;
  cancelBatch: () => Promise<void>;
  view: 'list' | 'setup' | 'dashboard';
  setView: (v: 'list' | 'setup' | 'dashboard') => void;
}

const BatchContext = createContext<BatchContextValue | null>(null);

export function useBatch() {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error('useBatch must be used within BatchProvider');
  return ctx;
}

export function BatchProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [model, setModel] = useState('veo-3.1-generate-preview');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [view, setView] = useState<'list' | 'setup' | 'dashboard'>('list');

  const {
    keys: apiKeys,
    selectedKeyId,
    apiKey,
    loading: apiKeysLoading,
    selectKey: selectApiKey,
    addKey: addApiKey,
    removeKey: removeApiKey,
  } = useApiKeys();

  const wakeLock = useWakeLock();
  const processor = useFragmentProcessor();
  const {
    config: timeoutConfig,
    loading: timeoutLoading,
    updateConfig: updateTimeoutConfig,
    resetToDefaults: resetTimeoutDefaults,
  } = useTimeoutConfig(project?.id || null);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const full: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setLogEntries((prev) => [...prev.slice(-500), full]);
  }, []);

  const handleFragmentUpdate = useCallback(
    (update: Partial<Fragment> & { id: string }) => {
      setFragments((prev) =>
        prev.map((f) => (f.id === update.id ? { ...f, ...update } : f))
      );
    },
    []
  );

  const realtimeCallbacks = useMemo(
    () => ({
      onProjectUpdate: (p: Project) => setProject(p),
      onFragmentUpdate: (f: Fragment) =>
        setFragments((prev) => prev.map((existing) => (existing.id === f.id ? f : existing))),
      onFragmentInsert: (f: Fragment) =>
        setFragments((prev) => {
          if (prev.some((existing) => existing.id === f.id)) return prev;
          return [...prev, f].sort((a, b) => a.sequence_order - b.sequence_order);
        }),
    }),
    []
  );

  useSupabaseRealtime(project?.id || null, realtimeCallbacks);

  const startBatch = useCallback(async () => {
    if (!project || !timeoutConfig || !apiKey) return;

    await wakeLock.request();
    setLogEntries([]);

    processor.start({
      projectId: project.id,
      apiKey,
      timeoutConfig,
      maxConcurrent: project.max_concurrent,
      model,
      referenceImageUrl: project.reference_image_url || undefined,
      onLog: addLog,
      onFragmentUpdate: handleFragmentUpdate,
    }).then(() => {
      wakeLock.release();
    });
  }, [project, timeoutConfig, apiKey, model, wakeLock, processor, addLog, handleFragmentUpdate]);

  const pauseBatch = useCallback(() => {
    processor.pause();
    wakeLock.release();
    addLog({ level: 'warn', message: 'Batch paused' });
  }, [processor, wakeLock, addLog]);

  const resumeBatch = useCallback(async () => {
    processor.resume();
    await wakeLock.request();
    addLog({ level: 'info', message: 'Batch resumed' });
  }, [processor, wakeLock, addLog]);

  const cancelBatch = useCallback(async () => {
    if (!project) return;
    await processor.cancel(project.id);
    await wakeLock.release();
    addLog({ level: 'error', message: 'Batch cancelled' });
  }, [project, processor, wakeLock, addLog]);

  const value = useMemo<BatchContextValue>(
    () => ({
      project,
      setProject,
      fragments,
      setFragments,
      apiKey,
      apiKeys,
      selectedKeyId,
      apiKeysLoading,
      selectApiKey,
      addApiKey,
      removeApiKey,
      model,
      setModel,
      timeoutConfig,
      timeoutLoading,
      updateTimeoutConfig,
      resetTimeoutDefaults,
      isProcessing: processor.isProcessing,
      isPaused: processor.isPaused,
      activeIds: processor.activeIds,
      wakeLock: {
        isSupported: wakeLock.isSupported,
        isActive: wakeLock.isActive,
        error: wakeLock.error,
      },
      logEntries,
      startBatch,
      pauseBatch,
      resumeBatch,
      cancelBatch,
      view,
      setView,
    }),
    [
      project,
      fragments,
      apiKey,
      apiKeys,
      selectedKeyId,
      apiKeysLoading,
      selectApiKey,
      addApiKey,
      removeApiKey,
      model,
      timeoutConfig,
      timeoutLoading,
      updateTimeoutConfig,
      resetTimeoutDefaults,
      processor.isProcessing,
      processor.isPaused,
      processor.activeIds,
      wakeLock.isSupported,
      wakeLock.isActive,
      wakeLock.error,
      logEntries,
      startBatch,
      pauseBatch,
      resumeBatch,
      cancelBatch,
      view,
    ]
  );

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
}
